// ボタン要素を取得
const backToTopBtn = document.getElementById("backToTopBtn");

// スクロール時のイベントリスナーを設定
window.onscroll = function () {
  scrollFunction();
};

function scrollFunction() {
  // ページトップからのスクロール量を取得
  // document.documentElement.scrollTop は主にモダンブラウザ用
  // document.body.scrollTop は IE 互換用
  const scrollPosition =
    document.body.scrollTop || document.documentElement.scrollTop;

  // スクロール量が特定の閾値（例: 200px）を超えたらボタンを表示
  if (scrollPosition > 200) {
    backToTopBtn.classList.add("show");
  } else {
    backToTopBtn.classList.remove("show");
  }
}

// ボタンクリック時のイベントリスナーを設定
backToTopBtn.addEventListener("click", function () {
  // スムーズスクロールの実装 (CSSの scroll-behavior: smooth; を使わない場合の例)
  window.scrollTo({
    top: 0,
    behavior: "smooth", // スムーズスクロール
  });
});
