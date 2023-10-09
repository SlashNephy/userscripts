// ==UserScript==
// @name            [Closed Test] AMQ Accelerate Loading
// @namespace       https://github.com/SlashNephy
// @version         0.2.0
// @author          SlashNephy
// @description     Load media faster from alternative sources.
// @description:ja  メディアを代替ソースから高速にロードします。
// @homepage        https://scrapbox.io/slashnephy/
// @homepageURL     https://scrapbox.io/slashnephy/
// @icon            https://animemusicquiz.com/favicon-32x32.png
// @updateURL       https://github.com/SlashNephy/userscripts/raw/master/dist/amq-accelerate-loading.user.js
// @downloadURL     https://github.com/SlashNephy/userscripts/raw/master/dist/amq-accelerate-loading.user.js
// @supportURL      https://github.com/SlashNephy/userscripts/issues
// @match           https://animemusicquiz.com/*
// @require         https://cdn.jsdelivr.net/gh/TheJoseph98/AMQ-Scripts@b97377730c4e8553d2dcdda7fba00f6e83d5a18a/common/amqScriptInfo.js
// @grant           GM_xmlhttpRequest
// @license         MIT license
// ==/UserScript==

(function () {
    'use strict';

    const awaitFor = async (predicate, timeout) => new Promise((resolve, reject) => {
        let timer;
        const interval = window.setInterval(() => {
            if (predicate()) {
                clearInterval(interval);
                clearTimeout(timer);
                resolve();
            }
        }, 500);
        if (timeout !== undefined) {
            timer = window.setTimeout(() => {
                clearInterval(interval);
                clearTimeout(timer);
                reject(new Error('timeout'));
            }, timeout);
        }
    });

    const onReady = (callback) => {
        if (document.getElementById('startPage')) {
            return;
        }
        awaitFor(() => document.getElementById('loadingScreen')?.classList.contains('hidden') === true)
            .then(callback)
            .catch(console.error);
    };

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

    const proxyHost = 'https://amq-proxy.starry.blue';
    async function checkSession() {
        try {
            const response = await executeGmXhr({
                url: `${proxyHost}/healthcheck`,
                redirect: 'error',
                anonymous: false,
            });
            return response.status >= 200 && response.status < 300;
        }
        catch (e) {
            return false;
        }
    }
    function replaceUrl(url) {
        return `${proxyHost}/api/media?u=${encodeURIComponent(url)}`;
    }
    onReady(async () => {
        const isAuthenticated = await checkSession();
        if (!isAuthenticated) {
            setTimeout(() => {
                void swal({
                    title: 'AMQ Accelerate Loading',
                    text: 'この UserScript を使用するにはユーザ認証が必要です。認証後、AMQ に再度ログインしてください。',
                    confirmButtonText: '認証',
                    showCancelButton: true,
                    cancelButtonText: 'キャンセル',
                    allowOutsideClick: false,
                    focusConfirm: true,
                    showCloseButton: false,
                    allowEscapeKey: false,
                }).then(() => {
                    window.location.replace(proxyHost);
                });
            }, 5000);
            return;
        }
        else {
            popoutMessages.displayStandardMessage('AMQ Accelerate Loading', '認証成功! UserScript は正常に動作しています。');
        }
        const { getNextVideoId } = MoeVideoPlayer.prototype;
        MoeVideoPlayer.prototype.getNextVideoId = function () {
            const url = getNextVideoId.apply(this);
            if (!url) {
                return undefined;
            }
            return replaceUrl(url);
        };
        const { showVideoPreview } = ExpandQuestionBox.prototype;
        ExpandQuestionBox.prototype.showVideoPreview = function (url, ...args) {
            if (url) {
                showVideoPreview.apply(this, [replaceUrl(url), ...args]);
            }
            else {
                showVideoPreview.apply(this, [url, ...args]);
            }
        };
        AMQ_addScriptData({
            name: '[Closed Test] Accelerate Loading',
            author: 'SlashNephy &lt;spica@starry.blue&gt;',
            description: 'Load media faster from alternative sources.',
        });
    });

})();
