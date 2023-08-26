function onloadCSS(e, t) {
  var n;
  function a() {
    !n && t && ((n = !0), t.call(e));
  }
  e.addEventListener && e.addEventListener('load', a),
    e.attachEvent && e.attachEvent('onload', a),
    'isApplicationInstalled' in navigator && 'onloadcssdefined' in e && e.onloadcssdefined(a);
}
!(function (e) {
  if (e.loadCSS) {
    var t = (loadCSS.relpreload = {});
    if (
      ((t.support = function () {
        try {
          return e.document.createElement('link').relList.supports('preload');
        } catch (e) {
          return !1;
        }
      }),
      (t.poly = function () {
        for (var t = e.document.getElementsByTagName('link'), n = 0; n < t.length; n++) {
          var a = t[n];
          'preload' === a.rel &&
            'style' === a.getAttribute('as') &&
            (e.loadCSS(a.href, a, a.getAttribute('media')), (a.rel = null));
        }
      }),
      !t.support())
    ) {
      t.poly();
      var n = e.setInterval(t.poly, 300);
      e.addEventListener &&
        e.addEventListener('load', function () {
          t.poly(), e.clearInterval(n);
        }),
        e.attachEvent &&
          e.attachEvent('onload', function () {
            e.clearInterval(n);
          });
    }
  }
})(this),
  (function (e) {
    'use strict';
    var t = function (t, n, a) {
      var o,
        r = e.document,
        l = r.createElement('link');
      if (n) o = n;
      else {
        var i = (r.body || r.getElementsByTagName('head')[0]).childNodes;
        o = i[i.length - 1];
      }
      var d = r.styleSheets;
      (l.rel = 'stylesheet'),
        (l.href = t),
        (l.media = 'only x'),
        (function e(t) {
          if (r.body) return t();
          setTimeout(function () {
            e(t);
          });
        })(function () {
          o.parentNode.insertBefore(l, n ? o : o.nextSibling);
        });
      var s = function (e) {
        for (var t = l.href, n = d.length; n--; ) if (d[n].href === t) return e();
        setTimeout(function () {
          s(e);
        });
      };
      function c() {
        l.addEventListener && l.removeEventListener('load', c), (l.media = a || 'all');
      }
      return l.addEventListener && l.addEventListener('load', c), (l.onloadcssdefined = s), s(c), l;
    };
    'undefined' != typeof exports ? (exports.loadCSS = t) : (e.loadCSS = t);
  })('undefined' != typeof global ? global : this);
