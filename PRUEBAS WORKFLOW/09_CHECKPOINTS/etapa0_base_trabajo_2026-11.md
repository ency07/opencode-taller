# Evidencia — Etapa 0 · Base de trabajo (sin código)

- **Fecha:** 2026-11-23 18:31 HPS
- **Autorización:** «AUTORIZO EXCLUSIVAMENTE LA ETAPA 0 — BASE DE TRABAJO»
- **Alcance ejecutado:** solo verificación de Git y creación de la rama de implementación. Sin cambios de código.

## 1. Verificación previa (rama y HEAD)

La comprobación previa (antes de crear la rama) dio:

```
rama activa : feat/multiproduct-poc-2026-11
HEAD        : 33df81d5823850767a28f9ec54f64104cd5547ce
ramas       :
  backup/pre-multiproduct-poc-2026-11      33df81d
  feat/product-contract-completion-2026-11 33df81d
  fix/creative-contract-guard-2026-11      8acd294
  main                                    d0ca672
tracked     : (ninguno)
```

## 2. Integridad de la POC (sha256)

```
c2c2a50401a8b4b0c13ffc9be67ae0209cc4d8b0aafb8e9909901959f2c7fa64  orquestador-multiproducto.js
9a13a103bbe5653fbcea7a4120e08e283d2c5c09c09ac1e890f1cf69de4f116a  poc_multiproducto_harness.js
8c5bb5ffe4b73fb13f89b9b89ec9ad27eebaddc40dc420f4fe357f9394360362  INFORME_POC_MULTIPRODUCTO_2026-11.md
3abde291661bcb3e394f767af8358e3c67161cd5ec14902b684aef6617775f88  prompt_CAMISETA_SOFT.txt
b860e906a0d027ad47f49043a01af6073903484062ff2a6e65bfd8ae5fb7d843  prompt_DISPLATE.txt
63b180d7db1e541de161c8a386bb1c4916a8d2c8c236de16b15223ab806ff392  resumen_poc.json
```

Tamaños: orquestador 200 lineas · harness 347 lineas.

## 3. Acción ejecutada

```
git branch feat/multiproducto-definitivo-2026-11 33df81d5823850767a28f9ec54f64104cd5547ce
git checkout feat/multiproducto-definitivo-2026-11
-> Switched to branch 'feat/multiproducto-definitivo-2026-11'
```

## 4. Verificación posterior

```
rama activa : feat/multiproducto-definitivo-2026-11
HEAD        : 33df81d5823850767a28f9ec54f64104cd5547ce
main        : d0ca672 feat: copiar prompt por partes (1/2 y 2/2) para chats que cortan entradas largas (#37)
fix guard   : 8acd294 fix: strict copy contract, contradiction resolution and DTF prep
tracked     : 0 modificados
```

## 5. Restricciones respetadas

- No se modificó ningún archivo de producción ni de la POC (los sha256 de arriba quedan como referencia).
- No se realizaron commits, push, merge ni despliegue.
- No se crearon ramas adicionales.
- No se comenzó la etapa 1.

## 6. Fingerprint

```
commit base: 33df81d5823850767a28f9ec54f64104cd5547ce
autor del commit base: Ency07 <eddieenciso@gmail.com> Fri Nov 20 17:24:04 2026 -0500
ramas hijas del commit base: backup/pre-multiproduct-poc-2026-11, feat/multiproduct-poc-2026-11, feat/multiproducto-definitivo-2026-11
```
