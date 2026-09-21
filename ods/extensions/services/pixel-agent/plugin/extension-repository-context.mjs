import { userMessageGitHubRepositoryUrl, githubReadmeUrl } from './tool-loop-guard.mjs';
import { ODS_EXTENSION_GITHUB_CONTRACT } from './prompt-contract.mjs';

// Ground an explicit repository request before the model can confuse a short
// project name with a different product. This only reads public documentation;
// it cannot create proposals, download applications or install anything.
export function createExtensionRepositoryContext({ tool, now = Date.now } = {}) {
  const cache = new Map();
  return async function repositoryContext(event, onRead = () => {}) {
    const messages = Array.isArray(event?.messages) ? event.messages : [];
    const lastUser = [...messages].reverse().find(message => message?.role === 'user');
    const content = typeof lastUser?.content === 'string' ? lastUser.content
      : Array.isArray(lastUser?.content) ? lastUser.content.filter(part => part?.type === 'text').map(part => part.text).join('\n') : '';
    let prompt = typeof event?.prompt === 'string' ? event.prompt : content;
    const delimiter = '[Current message - respond to this]\nUser:';
    prompt = prompt.replace(/\r\n/g, '\n');
    const boundary = prompt.indexOf(delimiter);
    if (boundary >= 0) {
      if (prompt.indexOf(delimiter, boundary + delimiter.length) >= 0) return '';
      prompt = prompt.slice(boundary + delimiter.length).trimStart();
    }
    if (!/^\s*(?:\/goal\s+)?\/extensions?\s+https:\/\/github\.com\//i.test(prompt)) return '';
    const repository = userMessageGitHubRepositoryUrl([], prompt);
    if (!repository) return '';
    for (const [key, entry] of cache) if (entry.expires <= now()) cache.delete(key);
    if (!cache.has(repository)) {
      if (cache.size >= 16) cache.delete(cache.keys().next().value);
      const value = Promise.resolve().then(() => tool.execute('extension-repository-context',
        {url: githubReadmeUrl(repository)}, AbortSignal.timeout(45000)))
        .catch(() => null);
      cache.set(repository, {expires: now() + 60000, value});
    }
    const result = await cache.get(repository).value;
    if (!result || result.isError) {
      cache.delete(repository);
      return `\n${ODS_EXTENSION_GITHUB_CONTRACT}\nThe exact extension repository is ${repository}. Its documentation read failed. Do not substitute another project with a similar name or claim installation requirements were verified. Use the exact repository to investigate, or report the unavailable evidence.`;
    }
    onRead(result);
    return `\n${ODS_EXTENSION_GITHUB_CONTRACT}\nExtension repository evidence for ${repository}. This is documentation only, not installation authorization. Keep this repository identity; do not substitute a similarly named project. Explain only verified requirements and identify files still unread.\n` +
      result.content.filter(part => part?.type === 'text').map(part => part.text).join('\n');
  };
}
