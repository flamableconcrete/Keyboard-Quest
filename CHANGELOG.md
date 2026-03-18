# Changelog

## [0.2.0](https://github.com/flamableconcrete/Keyboard-Quest/compare/v0.1.0...v0.2.0) (2026-03-18)


### Features

* add cook movement helpers with tests ([b212689](https://github.com/flamableconcrete/Keyboard-Quest/commit/b212689b012a2208055ebc8f63e08dbf8c66f994))
* add cook station data ([b22db36](https://github.com/flamableconcrete/Keyboard-Quest/commit/b22db36c8a2805a733d7c4d5d227e65efabce71d))
* add cook station data ([80f611b](https://github.com/flamableconcrete/Keyboard-Quest/commit/80f611b67a73e4c1f393e0fae81339730aa765c7))
* add CrazedCook pixel art textures (orc, cooks, kitchen bg) ([9a8da92](https://github.com/flamableconcrete/Keyboard-Quest/commit/9a8da92c1ea458e5e134049025ad604e5626d337))
* cooks wander between kitchen stations ([74e20ea](https://github.com/flamableconcrete/Keyboard-Quest/commit/74e20ea0eca1a6c9b34dc95652ca3a0ab05d1f61))
* implement full CrazedCookLevel scene with patience drain and orc tinting ([52d8aec](https://github.com/flamableconcrete/Keyboard-Quest/commit/52d8aec2f376cf333c217b121fc26facb91c8c59))
* move orcs/tickets/bars to seating zone, tickets to right of orc ([774b77b](https://github.com/flamableconcrete/Keyboard-Quest/commit/774b77b53196aa8ca0c2f30f830e1b55996fa5b8))
* orc attack animation on patience drain ([b20fcc3](https://github.com/flamableconcrete/Keyboard-Quest/commit/b20fcc31a626827564a876f355ab28d77cab1c01))
* redraw orc customer with axe and heavier silhouette ([1446f10](https://github.com/flamableconcrete/Keyboard-Quest/commit/1446f107a2bd0e7a6da7407028c02bfe54bcf2bc))
* rewrite kitchen background with 10 named stations ([e34e284](https://github.com/flamableconcrete/Keyboard-Quest/commit/e34e284d39c6007d06d8b48b9dd5b568646eb546))
* wire up CrazedCook level type, registration, and config ([a9fc39e](https://github.com/flamableconcrete/Keyboard-Quest/commit/a9fc39ed2659c6e4f9f423f401f0110153dce2fa))


### Bug Fixes

* add dark backing panel behind typing word, darken active ticket ingredient for legibility ([ab24c5d](https://github.com/flamableconcrete/Keyboard-Quest/commit/ab24c5d7eae9b089ffe33224ae85d6efa0606cea))
* add guard clause to pickNextStationIndex for stationCount &lt; 2 ([40a794c](https://github.com/flamableconcrete/Keyboard-Quest/commit/40a794cc91170cf60b4381fdc3985812cee3bf43))
* add missing bossId aliases for spider_boss, bone_knight_boss, flash_word_boss in BossBattleScene ([059eb6f](https://github.com/flamableconcrete/Keyboard-Quest/commit/059eb6f9eb7a1b9c8c7c41690e4c6419f0319448))
* correct patience bar Y and orc description in layout redesign spec ([aed9dbb](https://github.com/flamableconcrete/Keyboard-Quest/commit/aed9dbb062a76b2366b84fdd8bf922cc00107ddf))
* correct seat positions to truly center orcs on canvas ([7a578fc](https://github.com/flamableconcrete/Keyboard-Quest/commit/7a578fc5f1d7e97d5471d49bc32481d2acfea89c))
* lower finger hints position and highlight active ingredient on ticket ([58e37a5](https://github.com/flamableconcrete/Keyboard-Quest/commit/58e37a54873b9fea9227852f64a841879c0d8d8f))
* reduce crazed cook order quota to 8, extend time limit to 120s ([f0c9a0b](https://github.com/flamableconcrete/Keyboard-Quest/commit/f0c9a0b5c015d9e1b7d5b58bb2af8e560453df9a))
* reduce default order quota to 8, extend default time limit to 120s ([b572c98](https://github.com/flamableconcrete/Keyboard-Quest/commit/b572c986f520074bbd799be96e50aa6ee279b66f))
* remove dead horses and wordQueue properties from BoneKnightBoss ([e89b109](https://github.com/flamableconcrete/Keyboard-Quest/commit/e89b109603afba61e0910946d6ecc31f7d3c89c8))
* remove misclassified in-scope item from Out of Scope section ([3d6c7ed](https://github.com/flamableconcrete/Keyboard-Quest/commit/3d6c7ed15bed77aa3df2881613f59c7bef9b66fa))
* resolve spec inconsistencies in layout redesign ([6b1e98e](https://github.com/flamableconcrete/Keyboard-Quest/commit/6b1e98eddbdb2e0257f871b8b282a825a055f1a3))
* underline active ticket ingredient, bigger ticket font, lower dark word panel ([c00df19](https://github.com/flamableconcrete/Keyboard-Quest/commit/c00df1953384407e0ffcfe9f0385e85fd3d68a55))
* wire up finger hints and move TypingHands above typing engine in CrazedCookLevel ([6c08c40](https://github.com/flamableconcrete/Keyboard-Quest/commit/6c08c40cd2e9fbaab5d88af738f92d0739ecf9f7))
