# ROMYHACK Multi-Firmware v1.0

**Portal PS4 con detección de firmware, interfaz Cyber y hosts aislados.**

Creado para `romyhack-code`. No modifica el repositorio MPS actual ni las rutas de tu consola. El portal es estático y se publica desde un repositorio NUEVO.

## Estado de la compatibilidad

| Firmware | Motor | Estado |
| --- | --- | --- |
| 14.00 | Copia de `romyhack-code/mps` (Cyber Edition) | Confirmado previamente en la PS4 Slim del usuario; la copia de este paquete debe probarse |
| 14.02 | GamerHack G2All (Slopkit + Afterglow) | **Experimental**: soporte upstream, sin prueba propia |
| 5.05/5.07; 7.00–8.52; 9.00–9.60; 10.00–11.02; 11.50–11.52; 12.00–13.52 | GamerHack G2All | Declarado por upstream; algunos firmware intermedios pueden no contar con offsets, comprobar antes de usar |

La portada **no ejecuta código del exploit**. Los botones abren los módulos originales en rutas separadas. El navegador PS4 detecta firmware usando User-Agent; la elección manual es solo un selector de destino. No fuerces un firmware diferente.

## Arquitectura

```
ROMYHACK_MultiFirmware_v1/
├── index.html            # Portal y selector independiente
├── assets/
│   ├── app.js            # Detección y navegación ES5
│   └── style.css         # Cyber UI sin recursos externos
├── bootstrap.py          # Importa fuentes y valida archivos
├── server.py             # HTTP 8092, MIME cache-manifest
├── UPSTREAM_VERSIONS.txt  # Se genera con hashes upstream
├── hosts/
│   ├── mps14/            # Se genera desde romyhack-code/mps
│   ├── g2all/            # Se genera desde GamerHack g2all
│   ├── style.css         # G2All necesita ../style.css
│   └── img.jpg           # G2All necesita ../img.jpg
└── README.md
```

**El ZIP no contiene los binarios ni todo el código upstream.** `bootstrap.py` los descarga desde los repositorios públicos y completa el proyecto. Se fijan hashes de commit para importaciones reproducibles. Puedes optar por `--latest`, pero revisa los cambios y vuelve a probar antes de publicar.

## Pasos en Termux (Android)

1. Instalar las herramientas:

```bash
pkg update
pkg install git python unzip -y
termux-setup-storage
```

2. Copiar el ZIP a Descargas y extraer:

```bash
cd ~
unzip ~/storage/downloads/ROMYHACK_MultiFirmware_v1.zip -d ~
cd ~/ROMYHACK_MultiFirmware_v1
```

3. Importar archivos originales y ejecutar:

```bash
python bootstrap.py
python server.py
```

4. En el navegador de PS4, con la consola en la misma red:

```
http://IP-DEL-TELEFONO:8092/
```

Si el puerto 8092 está ocupado, usa `python server.py --port 8093`. Tu MPS original en el puerto 8088 sigue intacto.

## Kali Linux (servidor local de prueba)

```bash
cd ~/ROMYHACK_MultiFirmware_v1
python3 bootstrap.py
python3 server.py
```

Abre `http://IP-DE-KALI:8092/`. Si UFW bloquea, permite exclusivamente conexiones desde la LAN, por ejemplo:

```bash
sudo ufw allow from 192.168.100.0/24 to any port 8092 proto tcp
```

No necesitas cambiar la configuración de Nginx ni el puerto 80 de tu portafolio.

## GitHub Pages — publicación separada

1. Crea un **repositorio público NUEVO**, por ejemplo `romyhack-multifirmware`, bajo la cuenta `romyhack-code`. No modifiques `romyhack-code/mps`.
2. Completa `python bootstrap.py` desde Termux/Kali o una PC conectada a internet.
3. Sube **todo el contenido** de `ROMYHACK_MultiFirmware_v1` (incluido `hosts/` con los binarios importados) a la raíz del nuevo repositorio.
4. En `Settings → Pages`, elige `Deploy from a branch → main → /(root)`.
5. La URL, **solo después de la publicación**, será:

```
https://romyhack-code.github.io/romyhack-multifirmware/
```

Para publicar con Git, crea el repositorio vacío en GitHub y dentro de la carpeta local ejecuta:

```bash
git init -b main
git add .
git commit -m "Initial ROMYHACK Multi-Firmware v1"
git remote add origin https://github.com/romyhack-code/romyhack-multifirmware.git
git push -u origin main
```

Necesitas tu método habitual de autenticación de GitHub; nunca introduzcas un token en archivos públicos. Si Git pide identidad, configura `git config --global user.name` y `git config --global user.email`.

## Regenerar fuentes

- `python bootstrap.py --force` descarga de nuevo los commits **fijados** y archiva los anteriores como `.bak`.
- `python bootstrap.py --latest --force` descarga las versiones actuales, lo cual **puede cambiar** comportamiento y compatibilidad. Prueba primero fuera de tu PS4 principal.

**Precaución:** antes de publicar `--latest`, revisa qué cambió en `UPSTREAM_VERSIONS.txt`. Crea etiquetas o copias de la versión que funciona.

## Créditos y licencias

Este portal original es un selector; no reescribe las cadenas de explotación. Módulos de terceros:

- [ROMYHACK MPS](https://github.com/romyhack-code/mps) — fork de [mansoor0x/mps](https://github.com/mansoor0x/mps); conservar las atribuciones originales.
- [GamerHack G2All](https://github.com/GamerHack/GamerHack.github.io/tree/main/g2all) — código de terceros con créditos y posiblemente licencias distintas por componente. El archivo `afterglow.js` incluye aviso GNU AGPL. Revisar obligaciones de redistribución antes de publicar los binarios y fuentes copiados.

No se ha incorporado WebKitty en v1; el proyecto puede añadirse como otro motor en el futuro si demuestra estabilidad suficiente.

## Precauciones

- Ninguna versión 14.02 se ha probado físicamente para esta compilación.
- Los exploits pueden congelar o reiniciar la consola y causar pérdida de datos no guardados.
- No actualices tu consola 14.00 únicamente para usar este portal.
- Para mantener la estabilidad, **no combines** JavaScript, offsets ni `.bin` entre hosts.
- AppCache funciona en el navegador de PS4 pero no en navegadores modernos como Chrome. Revisa `cache.html` o la pantalla de caché específica del host.
- GitHub Pages es HTTPS, y algunas capacidades de red local de los hosts pueden comportarse de otra manera. Si necesitas el sitio HTTP, utiliza Termux o Kali.
