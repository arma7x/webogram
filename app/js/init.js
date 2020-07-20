var __INPUTFOCUSID = null
var __INPUTFOCUS = false
var __MODALSTACK = []
var __EXITAPP = true

function __pushModalStack(modal) {
  __EXITAPP = false
  __MODALSTACK.push(modal)
}

function __popModalStack() {
  __EXITAPP = true
  __MODALSTACK.pop()
}

function __getExitStatus() {
  return __EXITAPP
}

document.getScroll = function() {
  if (window.pageYOffset != undefined) {
    return [pageXOffset, pageYOffset]
  } else {
    var sx, sy, d = document,
        r = d.documentElement,
        b = d.body
    sx = r.scrollLeft || b.scrollLeft || 0
    sy = r.scrollTop || b.scrollTop || 0
    return [sx, sy]
  }
}

function handleKeydown(e) {
  console.log('handleKeydown init.js');
  switch(e.key) {
    case "SoftLeft":
      var scroll = document.getScroll()
      window.scroll(0, scroll[1]+20)
      break
    case "SoftRight":
      var scroll = document.getScroll()
      window.scroll(0, scroll[1]-20)
      break
    case "BrowserBack":
    case "Backspace":
      e.preventDefault()
      e.stopPropagation()
      if (__INPUTFOCUS && __INPUTFOCUSID !== null) {
        console.log('DEBUG', __INPUTFOCUS, __INPUTFOCUSID)
        var __INPUT = document.getElementById(__INPUTFOCUSID)
        if (__INPUT.value === "") {
          __INPUT.blur()
          __INPUTFOCUSID = null
          __INPUTFOCUS = false
        }
      } else if (__MODALSTACK.length > 0) {
        __MODALSTACK[__MODALSTACK.length - 1].dismiss()
      } else if (document.location.hash !== '#/im' && document.location.hash !== '#/login') {
        window.history.back()
      } else {
        window.close()
      }
      //console.log(document.location.hash, __EXITAPP)
      //console.log(__INPUTFOCUSID, __INPUTFOCUS)
      //if (document.location.hash === '#/login' && __EXITAPP) {
        //window.close()
      //} else if (document.location.hash === '#/im' && __EXITAPP) {
        //window.close()
      //} else {
        //__EXITAPP = true
      //}
      break
    case "Control":
    case "Call":
      $("input").blur()
      if (__INPUTFOCUS && __INPUTFOCUSID !== null) {
        var __INPUT = document.getElementById(__INPUTFOCUSID)
        if (__INPUT.value === "") {
          __INPUT.blur()
          __INPUTFOCUSID = null
          __INPUTFOCUS = false
        }
      }
      break
  }
  return
}
document.activeElement.addEventListener('keydown', handleKeydown)

;(function initApplication () {

  // Prevent click-jacking
  try {
    if (window == window.top || window.chrome && chrome.app && chrome.app.window) {
      document.documentElement.style.display = 'block'
    } else {
      top.location = self.location
    }
  } catch (e) {console.error('CJ protection', e) }

  var classes = [
    Config.Navigator.osX ? 'osx' : 'non_osx',
    Config.Navigator.msie ? 'msie' : 'non_msie',
    Config.Navigator.retina ? 'is_2x' : 'is_1x'
  ]
  if (Config.Modes.ios_standalone) {
    classes.push('ios_standalone')
  }
  $(document.body).addClass(classes.join(' '))

  ConfigStorage.get('layout_selected', 'i18n_locale', function (params) {
    var layout = params[0]
    var locale = params[1]
    var defaultLocale = 'en-us'
    var bootReady = {
      dom: false,
      i18n_ng: false,
      i18n_messages: false,
      i18n_fallback: false
    }
    var checkReady = function checkReady () {
      var i
      var ready = true
      for (i in bootReady) {
        if (bootReady.hasOwnProperty(i) && bootReady[i] === false) {
          ready = false
          break
        }
      }
      if (ready) {
        bootReady.boot = false
        angular.bootstrap(document, ['myApp'])
      }
    }

    if (Config.Modes.force_mobile) {
      layout = 'mobile'
    }
    else if (Config.Modes.force_desktop) {
      layout = 'desktop'
    }

    switch (layout) {
      case 'mobile':
        Config.Mobile = true
        break
      case 'desktop':
        Config.Mobile = false
        break
      default:
        var width = $(window).width()
        Config.Mobile = Config.Navigator.mobile || width > 10 && width < 480
        break
    }
    $('head').append(
      '<link rel="stylesheet" href="css/' + (Config.Mobile ? 'mobile.css' : 'desktop.css') + '" />'
    )

    if (!locale) {
      locale = (navigator.language || '').toLowerCase()
      locale = Config.I18n.aliases[locale] || locale
    }
    for (var i = 0; i < Config.I18n.supported.length; i++) {
      if (Config.I18n.supported[i] == locale) {
        Config.I18n.locale = locale
        break
      }
    }
    bootReady.i18n_ng = Config.I18n.locale == defaultLocale // Already included

    $.getJSON('js/locales/' + Config.I18n.locale + '.json').success(function (json) {
      Config.I18n.messages = json
      bootReady.i18n_messages = true
      if (Config.I18n.locale == defaultLocale) { // No fallback, leave empty object
        bootReady.i18n_fallback = true
      }
      checkReady()
    })

    if (Config.I18n.locale != defaultLocale) {
      $.getJSON('js/locales/' + defaultLocale + '.json').success(function (json) {
        Config.I18n.fallback_messages = json
        bootReady.i18n_fallback = true
        checkReady()
      })
    }

    $(document).ready(function () {
      bootReady.dom = true
      if (!bootReady.i18n_ng) { // onDOMready because needs to be after angular
        $('<script>').appendTo('body')
          .on('load', function () {
            bootReady.i18n_ng = true
            checkReady()
          })
          .attr('src', 'vendor/angular/i18n/angular-locale_' + Config.I18n.locale + '.js')
      } else {
        checkReady()
      }
    })
  })
})()
