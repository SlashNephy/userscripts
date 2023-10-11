// ==UserScript==
// @name            Download Scripts
// @namespace       https://github.com/SlashNephy
// @version         0.0.1
// @author          SlashNephy
// @description     Register a function to download all the JavaScript files from current document into window.
// @description:ja  現在の document 内のすべての JavaScript ファイルをダウンロードする関数を window に登録します。
// @homepage        https://scrapbox.io/slashnephy/
// @homepageURL     https://scrapbox.io/slashnephy/
// @icon            https://www.google.com/s2/favicons?sz=64&domain=*
// @updateURL       https://github.com/SlashNephy/userscripts/raw/master/dist/download-scripts.user.js
// @downloadURL     https://github.com/SlashNephy/userscripts/raw/master/dist/download-scripts.user.js
// @supportURL      https://github.com/SlashNephy/userscripts/issues
// @match           http://*/*
// @match           https://*/*
// @require         https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @require         https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant           unsafeWindow
// @grant           GM_xmlhttpRequest
// @grant           GM_registerMenuCommand
// @license         MIT license
// ==/UserScript==

(function (fileSaver, JSZip) {
    'use strict';

    const executeGmXhr = async (request) => new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
            ...request,
            onload: (response) => {
                resolve(response);
            },
            onerror: (error) => {
                reject(error);
            },
        });
    });

    let inlines = 0;
    async function downloadScripts() {
        const zip = new JSZip();
        for (const { type, src, textContent } of Array.from(document.getElementsByTagName('script'))) {
            if (type !== '' && type !== 'text/javascript') {
                continue;
            }
            try {
                if (src) {
                    await addRemoteScript(zip, new URL(src));
                }
                else if (textContent) {
                    addInlineScript(zip, textContent);
                }
            }
            catch (e) {
                console.warn(`failed to fetch script: ${e}`);
            }
        }
        const blob = await zip.generateAsync({ type: 'blob' });
        fileSaver.saveAs(blob, `${sanitizeHost(window.location.host)}.zip`);
    }
    async function addRemoteScript(zip, url) {
        const directoryName = sanitizeHost(url.host);
        const directory = zip.folder(directoryName);
        if (!directory) {
            throw new Error(`failed to create folder: ${directoryName}`);
        }
        const { responseText } = await executeGmXhr({ url: url.toString() });
        const path = url.pathname.split('/').pop() ?? 'index.js';
        directory.file(path, responseText);
    }
    function addInlineScript(zip, content) {
        const directoryName = sanitizeHost(window.location.host);
        const directory = zip.folder(directoryName);
        if (!directory) {
            throw new Error(`failed to create folder: ${directoryName}`);
        }
        const path = `inline_${inlines++}.js`;
        directory.file(path, content);
    }
    function sanitizeHost(host) {
        return host.replace(':', '_');
    }
    unsafeWindow.downloadScripts = downloadScripts;
    GM_registerMenuCommand('Download Scripts', () => {
        downloadScripts().catch(console.error);
    });

})(FileSaver, JSZip);
