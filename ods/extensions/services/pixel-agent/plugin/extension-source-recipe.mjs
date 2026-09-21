// Compile ODS packaging conventions, never invent application behavior.
// The model supplies the researched Dockerfile, entrypoint and health probe;
// the normal API validator and source/provenance checks remain authoritative.
export const sourceRecipeSchema = {
  type: 'object', additionalProperties: false,
  required: ['repository', 'commit', 'serviceId', 'name', 'port'],
  properties: {
    repository: {type: 'string'}, commit: {type: 'string', pattern: '^[a-f0-9]{40}$'},
    serviceId: {type: 'string', pattern: '^[a-z0-9][a-z0-9-]{0,63}$'},
    name: {type: 'string'},
    dockerfile: {type: 'string', description: 'Observed repository-relative Dockerfile path. Use this OR dockerfileInline.'},
    dockerfileInline: {type: 'string', description: 'Complete project-specific Dockerfile if upstream has none. COPY the checked-out source and install that source, not a same-named registry package. Research dependencies and the actual entrypoint first. Shell dollars are escaped by ODS.'},
    port: {type: 'integer', minimum: 0, maximum: 65535, description: 'Actual HTTP application port, or 0 for a CLI-only image.'},
    healthPath: {type: 'string', description: 'Required for a web service: actual HTTP health path. Omit for a CLI-only image.'},
    healthcheck: {type: 'array', minItems: 2, items: {type: 'string'}, description: 'Required for a web service: real Docker healthcheck starting with CMD or CMD-SHELL. For cliOnly, omit; ODS verifies the command exit instead.'},
    command: {type: 'array', minItems: 1, items: {type: 'string'}, description: 'Actual application arguments; omit to retain the Dockerfile CMD.'},
    cliOnly: {type: 'boolean', description: 'Only for an upstream CLI/library without a server: command must run a real successful application verification and exit. No web endpoint will be advertised.'},
  },
};

export function compileSourceRecipe(source) {
  if (!source || typeof source !== 'object' || Array.isArray(source)
      || Object.keys(source).some(key => !Object.hasOwn(sourceRecipeSchema.properties, key))) throw Error('Use only the documented source fields.');
  const missing = sourceRecipeSchema.required.filter(key => !Object.hasOwn(source, key));
  if (missing.length) throw Error('Missing source fields: ' + missing.join(', ') + '. Read this tool schema. A CLI-only image needs cliOnly=true, port=0 and a real verification command.');
  const {repository, commit, serviceId, name, port, healthPath = '', healthcheck, command, cliOnly = false} = source;
  if (typeof repository !== 'string' || !/^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]{0,38}\/[A-Za-z0-9][A-Za-z0-9._-]{0,99}\/?$/.test(repository)
      || typeof commit !== 'string' || !/^[a-f0-9]{40}$/.test(commit)
      || typeof serviceId !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(serviceId)
      || typeof name !== 'string' || !name.trim() || name.length > 160
      || !Number.isInteger(port) || port < 0 || port > 65535
      || typeof healthPath !== 'string' || healthPath.length > 256
      || (healthPath !== '' && !/^\/[A-Za-z0-9_/.~-]*$/.test(healthPath))
      || typeof cliOnly !== 'boolean') throw Error('Use a public repository, verified commit and valid service metadata.');
  const strings = value => Array.isArray(value) && value.length > 0 && value.length <= 32
    && value.every(item => typeof item === 'string' && item.length > 0 && item.length <= 4096 && !item.includes('\0'));
  if (cliOnly && command === undefined) {
    throw Error('source.command is required for cliOnly=true. Supply the researched verification command as an argument array in source.command. Dockerfile CMD alone does not supply this field. Keep the remaining source fields and correct this omission.');
  }
  if ((!cliOnly || healthcheck !== undefined) && (!strings(healthcheck) || healthcheck.length < 2 || !['CMD', 'CMD-SHELL'].includes(healthcheck[0]))) {
    throw Error('A web service needs a real healthcheck argument array starting with CMD or CMD-SHELL.');
  }
  if (command !== undefined && !strings(command)) throw Error('Supply the actual command as a nonempty argument array.');
  if (cliOnly ? (port !== 0 || healthPath !== '' || !command) : (port === 0 || !healthPath)) {
    throw Error('A web service needs its real port and health path. A CLI-only image needs port 0, empty healthPath and a verification command.');
  }
  const hasFile = typeof source.dockerfile === 'string' && source.dockerfile.length > 0;
  const hasInline = typeof source.dockerfileInline === 'string' && source.dockerfileInline.trim().length > 0;
  if (hasFile === hasInline || (hasInline && source.dockerfileInline.length > 20000)) throw Error('Supply exactly one inspected dockerfile path or complete dockerfileInline.');
  if (hasInline && !/^\s*COPY\s+(?!--from=)/im.test(source.dockerfileInline)) {
    throw Error('The Dockerfile must COPY and use the checked-out repository source. Installing a same-named registry package does not install this verified commit.');
  }
  const canonicalRepository = repository.replace(/\/$/, '').replace(/\.git$/, '');
  const escapeCompose = value => value.replace(/\$/g, '$$$$');
  const portVariable = serviceId.replace(/-/g, '_').toUpperCase() + '_PORT';
  const service = {
    container_name: `ods-${serviceId}`,
    image: `ods-source-${serviceId}:${commit}`,
    build: {context: `${canonicalRepository}.git#${commit}`,
      ...(hasFile ? {dockerfile: source.dockerfile} : {dockerfile_inline: escapeCompose(source.dockerfileInline)})},
    pull_policy: 'never',
    ...(!cliOnly ? {healthcheck: {test: healthcheck.map(escapeCompose), interval: '30s', timeout: '10s', retries: 3}} : {}),
    ...(command ? {command: command.map(escapeCompose)} : {}),
    ...(!cliOnly ? {ports: [`127.0.0.1:\${${portVariable}:-${port}}:${port}`], restart: 'unless-stopped'} : {}),
  };
  return {repository: canonicalRepository, commit,
    manifest: {schema_version: 'ods.services.v1', service: {
      id: serviceId, name, type: 'docker', category: 'optional', compose_file: 'compose.yaml',
      port, health: healthPath, ...(cliOnly ? {startup_check: false, external_link: false}
        : {external_port_env: portVariable, external_port_default: port}),
    }}, compose: {services: {[serviceId]: service}},
  };
}
