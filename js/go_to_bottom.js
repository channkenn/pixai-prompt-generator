// 新しいボタン要素を取得
const goToBottomBtn = document.getElementById("goToBottomBtn");

// スクロール時のイベントリスナーを設定
window.onscroll = function () {
  // 既存の backToTopBtn の scrollFunction() がある場合はそれを残す
  // scrollFunction();

  // 最下部ボタンの表示/非表示を処理する関数を呼び出す
  toggleGoToBottomButton();
};

function toggleGoToBottomButton() {
  const scrollPosition =
    document.body.scrollTop || document.documentElement.scrollTop;

  // ページ全体の高さを取得
  const fullHeight = document.documentElement.scrollHeight;
  // ビューポート（画面）の高さを取得
  const viewportHeight = document.documentElement.clientHeight;

  // 最下部ボタンは、ページトップから少しスクロールされたら表示
  // (例: 200pxを超えたら表示、またはページ最下部に近づいたら非表示にするロジックも可能)

  // ここではシンプルに、ページトップから200pxスクロールしたら表示
  if (scrollPosition > 200) {
    goToBottomBtn.classList.remove("hide");
  } else {
    goToBottomBtn.classList.add("hide");
  }
}

// ボタンクリック時のイベントリスナーを設定
// ボタンクリック時のイベントリスナーを設定
goToBottomBtn.addEventListener("click", function () {
  // ページの全高を取得 (最も長いものを採用)
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );

  // ビューポート（画面）の高さを取得
  const viewportHeight = window.innerHeight; // または document.documentElement.clientHeight

  // スクロール先の最終的なY座標を計算
  // = (ページの全高) - (ビューポートの高さ)
  const scrollToY = totalHeight - viewportHeight;

  // ページ全体の一番下へスクロール
  window.scrollTo({
    top: scrollToY, // 画面の一番下にページの最下部が来る座標
    behavior: "smooth", // スムーズスクロール
  });
});
