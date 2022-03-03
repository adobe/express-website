/* eslint-disable */
if ((!window.fetch) || (window.location.href.indexOf('legacy=on') >= 0)) { 
  console.log(window.fetch);
  if (Math.random() < 0.1) {
    var hashCode = function hashCode(s) {
      return s.split('').reduce(function (a, b) {
        return (a << 5) - a + b.charCodeAt(0) | 0;
      }, 0);
    };  
    var id = ''.concat(hashCode(window.location.href), '-').concat(new Date().getTime(), '-').concat(Math.random().toString(16).substr(2, 14));
    var data = JSON.stringify({ referer: window.location.href, checkpoint: 'unsupported', weight: 10, id: id }); var img = new Image(); img.src = 'https://rum.hlx3.page/.rum/10?data='+encodeURIComponent(data);  
  }
  var locale = window.location.href.split('/')[3];
  var redirect = 'https://express.adobe.com/unsupported';
  var redirects = { 
    jp: 'https://express.adobe.com/ja-JP/unsupported',
    kr: 'https://express.adobe.com/ko-KR/unsupported',
  };
  if (locale && redirects[locale]) redirect = redirects[locale];
  setTimeout(window.location.href = redirect, 2000);
}