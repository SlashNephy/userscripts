const expectedBody = '認証の詳細を受信、詳細を処理中です。このウィンドウをいつでも閉じることができます。'

function closeWindow() {
  if (document.body.textContent === expectedBody) {
    window.close()
  }
}

closeWindow()
addEventListener('load', closeWindow)
