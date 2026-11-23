/* ROMYHACK Multi-Firmware v1 — the portal never executes an exploit itself. */
(function () {
  'use strict';
  var ua = navigator.userAgent || '';
  var match = ua.match(/PlayStation 4[ \/]([0-9]+\.[0-9]+)/i);
  var detected = match ? match[1] : null;
  var buttons = document.querySelectorAll('.fw-btn');
  var deviceValue = document.getElementById('deviceValue');
  var fwValue = document.getElementById('fwValue');
  var hint = document.getElementById('detectionHint');
  var engineName = document.getElementById('engineName');
  var engineMeta = document.getElementById('engineMeta');
  var engineStatus = document.getElementById('engineStatus');
  var warning = document.getElementById('warning');
  var launch = document.getElementById('launchBtn');
  var cache = document.getElementById('cacheBtn');
  var actionInfo = document.getElementById('actionInfo');
  var allowed = [
    [5.05, 5.07], [7.00, 8.52], [9.00, 9.60],
    [10.00, 11.02], [11.50, 11.52], [12.00, 14.02]
  ];

  function supported(fw) {
    var value = parseFloat(fw);
    if (isNaN(value)) return false;
    for (var i = 0; i < allowed.length; i++) {
      if (value >= allowed[i][0] && value <= allowed[i][1]) return true;
    }
    return false;
  }
  function cacheFor(fw) {
    var n = parseFloat(fw);
    if (n === 5.05 || n === 5.07) return 'cache505.html';
    if (n >= 7.00 && n <= 8.52) return 'cache700.html';
    if (n >= 9.00 && n <= 9.60) return 'cache900.html';
    if (n >= 10.00 && n <= 11.02) return 'cachecss.html';
    if (n >= 11.50 && n <= 14.02) return 'cacheslopkit.html';
    return 'index.html';
  }
  function setAnchor(anchor, path) {
    anchor.setAttribute('href', path);
    anchor.className = anchor.className.replace(/\sdisabled/g, '');
    anchor.removeAttribute('aria-disabled');
  }
  function reset() {
    engineName.textContent = 'FIRMWARE NO COMPATIBLE';
    engineMeta.textContent = 'No se encontró un módulo validado para esta versión.';
    engineStatus.textContent = '● NO DISPONIBLE';
    engineStatus.className = 'status-line';
    launch.className += launch.className.indexOf('disabled') === -1 ? ' disabled' : '';
    cache.className += cache.className.indexOf('disabled') === -1 ? ' disabled' : '';
    launch.setAttribute('href', '#'); cache.setAttribute('href', '#');
    launch.setAttribute('aria-disabled', 'true'); cache.setAttribute('aria-disabled', 'true');
    warning.style.display = 'block';
    warning.textContent = 'No ejecutes un exploit destinado a otro firmware.';
  }
  function choose(fw, auto) {
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var value = b.getAttribute('data-fw');
      b.className = b.className.replace(/\sactive/g, '');
      if (value === fw) b.className += ' active';
    }
    fwValue.textContent = detected || 'SIN DETECTAR';
    if (!supported(fw)) { reset(); return; }
    warning.style.display = 'none';
    if (fw === '14.00') {
      engineName.textContent = 'MPS · ROMYHACK 14.00';
      engineMeta.textContent = 'Edición Cyber probada en PS4 Slim. Módulo preservado, separado del host multi-firmware.';
      engineStatus.textContent = '● VERIFICADO EN TU PS4';
      engineStatus.className = 'status-line ready';
      setAnchor(launch, 'hosts/mps14/index.html');
      setAnchor(cache, 'hosts/mps14/cache.html');
      actionInfo.textContent = 'Este módulo mantiene su propio manifiesto de caché y archivos del exploit.';
    } else {
      engineName.textContent = 'G2ALL · MULTI-FIRMWARE';
      engineMeta.textContent = 'Módulo independiente basado en GamerHack. La selección real de exploit se hace dentro del host.';
      setAnchor(launch, 'hosts/g2all/index.html');
      setAnchor(cache, 'hosts/g2all/' + cacheFor(fw));
      if (fw === '14.02') {
        engineStatus.textContent = '● EXPERIMENTAL · SIN PRUEBA PROPIA';
        engineStatus.className = 'status-line beta';
        warning.style.display = 'block';
        warning.textContent = 'Firmware 14.02: soporte anunciado por el proyecto upstream, pero no verificado en una consola tuya. Puede causar bloqueos o reinicios. Usa este módulo solo tras comprobar la versión de la consola.';
        actionInfo.textContent = 'No se inicia automáticamente. El botón abre el host original en una ruta aislada.';
      } else {
        engineStatus.textContent = '● SOPORTE DECLARADO POR UPSTREAM';
        engineStatus.className = 'status-line beta';
        actionInfo.textContent = 'Compatibilidad de origen; no se han realizado pruebas independientes en todas las versiones.';
      }
    }
    if (auto && detected) hint.textContent = 'Firmware detectado automáticamente: ' + detected + '. Confirma que corresponde a la versión instalada en tu consola.';
  }
  deviceValue.textContent = detected ? 'PLAYSTATION 4' : 'NAVEGADOR EXTERNO';
  fwValue.textContent = detected || 'SIN DETECTAR';
  if (detected && supported(detected)) choose(detected, true);
  else if (detected) { reset(); hint.textContent = 'El firmware detectado (' + detected + ') no figura entre las versiones configuradas.'; }
  else { hint.textContent = 'Navegador de PC o teléfono detectado. Selecciona una versión para explorar las rutas; el host solo se ejecuta en una PS4 compatible.'; }
  for (var i = 0; i < buttons.length; i++) {
    (function (b) { b.onclick = function () { choose(b.getAttribute('data-fw'), false); }; })(buttons[i]);
  }
  function guardClick(e) {
    if (this.getAttribute('aria-disabled') === 'true') {
      if (e && e.preventDefault) e.preventDefault();
      return false;
    }
    return true;
  }
  launch.onclick = guardClick;
  cache.onclick = guardClick;
})();
