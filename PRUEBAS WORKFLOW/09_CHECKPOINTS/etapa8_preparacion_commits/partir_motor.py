"""Etapa 8 - Particion de js/motor-nucleo.js entre dos commits.

Motivo: motor-nucleo.js contiene dos cambios independientes (mockup por superficie y
copy Explore). Este script construye, SIN modificar el arbol, la version intermedia
"commit 1" (solo superficie) revertiendo por texto los dos hunks de copy.

Uso (ejemplo, con salida en scratch):
    python3 partir_motor.py <repo> <salida>

Verificaciones que hace:
  - cada hunk aparece exactamente una vez;
  - la version intermedia + hunks de copy reproduce el fichero actual;
  - node --check acepta la version intermedia.
"""
import hashlib
import os
import re
import subprocess
import sys


def main():
    repo = sys.argv[1] if len(sys.argv) > 1 else "."
    out = sys.argv[2] if len(sys.argv) > 2 else "."

    real = open(os.path.join(repo, "js/motor-nucleo.js"), "rb").read()
    diff = subprocess.run(
        ["git", "-C", repo, "diff", "33df81d5823850767a28f9ec54f64104cd5547ce",
         "--", "js/motor-nucleo.js"],
        capture_output=True, check=True).stdout.decode("utf-8")

    hunks = []
    cur = None
    for l in diff.split("\n"):
        l = l[:-1] if l.endswith("\r") else l
        if l.startswith("@@"):
            cur = {"old": [], "new": []}
            hunks.append(cur)
        elif cur is not None and l[:1] in ("-", "+") and not l.startswith(("---", "+++")):
            (cur["old"] if l[0] == "-" else cur["new"]).append(l[1:])
        elif cur is not None and l.startswith(" "):
            cur["old"].append(l[1:])
            cur["new"].append(l[1:])

    assert len(hunks) == 3, "se esperaban 3 hunks, hay %d" % len(hunks)

    def a_bytes(lista):
        return b"\n".join(x.encode("utf-8") for x in lista)

    copy_hunks = [hunks[0], hunks[1]]
    sup_hunk = hunks[2]

    contenido = real.replace(b"\r\n", b"\n")
    for i, h in enumerate(copy_hunks):
        seg_new = a_bytes(h["new"])
        seg_old = a_bytes(h["old"])
        n = contenido.count(seg_new)
        assert n == 1, "hunk copy %d: apariciones=%d" % (i + 1, n)
        contenido = contenido.replace(seg_new, seg_old)

    # la version intermedia + hunks de copy debe reproducir el original
    recon = contenido
    for h in copy_hunks:
        recon = recon.replace(a_bytes(h["old"]), a_bytes(h["new"]))
    assert recon == real.replace(b"\r\n", b"\n"), "la reconstruccion no coincide"

    ruta = os.path.join(out, "motor_nucleo_commit1_solo_superficie.js")
    with open(ruta, "wb") as f:
        f.write(contenido.replace(b"\n", b"\r\n"))
    print("generado:", ruta)
    print("lineas:", contenido.count(b"\n"))
    print("sha256(IF):", hashlib.sha256(contenido).hexdigest()[:16])
    r = subprocess.run(["node", "--check", ruta], capture_output=True, text=True)
    print("node --check rc:", r.returncode, (r.stderr or "").strip()[:120])


if __name__ == "__main__":
    main()
