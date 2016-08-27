import { Meteor } from 'meteor/meteor';
import { loadFront } from 'yaml-front-matter';
import { GitHubConnector } from './github';

Meteor.startup(() => {
  // code to run on server at startup
  const connector = new GitHubConnector();

  connector.get(`/repos/partyparrot/GitHunt-API-code-tour/contents/sample-page.md`).then((data) => {
    const content = new Buffer(data.content, 'base64').toString();
    console.log({
      ...parseMD(content),
      slug: 'sample-page',
    });
  });
});

function parseMD(md) {
  const {
    title,
    code,
    __content: content,
  } = loadFront(md);

  const metadata = parseGitHubURL(code);

  const contentBlocks = parseContentBlocks(content, metadata);

  return {
    title,
    codeURL: code,
    content: contentBlocks,
    ...metadata,
  };
}

function parseGitHubURL(url) {
  // XXX this regex fails when there is only one line selected
  const re = /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^#]+)#L(\d+)-L(\d+)$/;
  const [
    str,
    user,
    repoName,
    commit,
    filePath,
    lineStart,
    lineEnd,
  ] = re.exec(url);

  const fileUrl = url.split('#')[0];

  return {
    user,
    repoName,
    commit,
    filePath,
    lineStart,
    lineEnd,
    fileUrl,
  };
}

function parseContentBlocks(content, metadata) {
  const lines = content.split('\n');

  const segments = [];

  let currSegment = {
    slug: null,
    lineStart: null,
    lineEnd: null,
    content: '',
  };

  lines.forEach((line) => {
    if (line.indexOf(metadata.fileUrl) === -1) {
      currSegment.content += line + '\n';
      return;
    }

    // Close off current segment
    segments.push(currSegment);

    const re = /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/([^#]+)#L(\d+)(-L(\d+))?/;

    // This line contains a GitHub URL that points to the same file
    let [
      url,
      user,
      repoName,
      hash,
      path,
      lineStart,
      unused,
      lineEnd,
    ] = re.exec(line);

    if (!lineEnd) {
      lineEnd = lineStart;
    }

    const slug = /id="([^"]+)"/.exec(line)[1];
    const contentWithoutAnchorTag = /<a[^>]+>(.+)<\/a>/.exec(line)[1];

    currSegment = {
      slug,
      lineStart,
      lineEnd,
      content: contentWithoutAnchorTag,
    };
  });

  segments.push(currSegment);

  return segments;
}