// ドット絵（16×16。職業は32×32の細かい版＋小さい表示用の16×16）
//   rows の1文字が1マス。'.' は透明、それ以外の文字は pal の色
//   大きく表示するときは src/ui/sprite.js が自動で2倍に精細化して縁取りする
//   描き直すときは rows の文字を書き換える。本物の画像に差し替えるときは、このIDごとに置き換えればよい
(function (R) {
  R.DATA = R.DATA || {};

  const SKIN = '#e8c39e', EYE = '#2a1f1a', BOOT = '#4a3526';

  R.DATA.sprites = {
    // ===== 職業 =====
    swordsman: {
      // 32×32（細かい版）。小さく表示するときは small（16×16）を使う
      pal: { H: '#c4ccdc', h: '#8a92a8', K: '#5a6074', P: '#d84a3a', p: '#9a2e26', S: '#f2cca4', s: '#d09a78', E: '#2a1f1a', W: '#ffffff', R: '#8a5a32', M: '#b8645a', B: '#4a70b8', b: '#32508e', A: '#d0d6e2', a: '#8e96aa', C: '#e8c25a', c: '#a8842e', L: '#6a4628', G: '#3c4258', g: '#2a2e40', F: '#6a4228', f: '#3e2616', X: '#eef4fa', x: '#9aa6b8', Y: '#c8962e', y: '#7a5a1e' },
      rows: [
        '................................',
        '..............pPP...............',
        '.............pPPPP..............',
        '............pPPPP...............',
        '..........hHHHHHHHh.............',
        '.........hHHHHHHHHHh.........X..',
        '........hHHHHHHHHHHHh.......XXx.',
        '........hHHKKKKKKKHHh.......XXx.',
        '........hHKRRRRRRRKHh.......XXx.',
        '........hHRRSSSSSRRHh.......XXx.',
        '........hKRSSSSSSSRKh.......XXx.',
        '........hKSSWESSWESSh.......XXx.',
        '.........KSSEESSEESK........XXx.',
        '.........sSSSSSSSSSs........XXx.',
        '..........sSSSMMSSs.........XXx.',
        '...........ssSSSss..........XXx.',
        '.........aAAAsssAAAa........XXx.',
        '........aAAAABBBAAAAa.......XXx.',
        '.......aAAAABBCBBAAAAa......XXx.',
        '.......aAaABBCCCBBaAAa....yYYYYy',
        '.......SSbBBBBCBBBBbaSSs..SSyySS',
        '.......SSbBBBBBBBBBbsSSSSSSSyyS.',
        '.......ssLLLLLCcLLLLs.....SSyy..',
        '.........bBBBBBBBBBBb.......Y...',
        '.........bbBBBBBBBBbb...........',
        '.........GGGGGGGGGGGG...........',
        '.........GGGGg..GGGGG...........',
        '.........GGGGg..GGGGg...........',
        '.........gGGGg..gGGGg...........',
        '........FFFFFf..FFFFFf..........',
        '........fffffF..fffffF..........',
        '................................'
      ],
      small: {
        pal: { H: '#9aa3b5', h: '#6b7385', S: SKIN, E: EYE, B: '#4c6a9a', b: '#36507a', C: '#d8b45a', W: '#dfe6ee', G: '#a07a30', F: BOOT },
        rows: [
          '................',
          '.....HHHHHH.....',
          '....HHHHHHHH....',
          '....HhhhhhhH..W.',
          '....SSESSESS..W.',
          '....SSSSSSSS..W.',
          '.....SSSSSS...W.',
          '....BBBBBBBB.GWG',
          '...BBBBCCBBBBSG.',
          '...SBBBCCBBB....',
          '...SBBBBBBBB....',
          '....bbbbbbbb....',
          '....BBBBBBBB....',
          '....BB....BB....',
          '....BB....BB....',
          '...FFF....FFF...'
        ]
      }
    },
    mage: {
      // 32×32（細かい版）。小さく表示するときは small（16×16）を使う
      pal: { H: '#6a4aa8', h: '#4a3080', k: '#2e1e5a', Y: '#f2d675', S: '#f2cca4', s: '#d09a78', E: '#2a1f1a', W: '#ffffff', R: '#d8d0e0', r: '#a8a0b8', B: '#5e40a0', b: '#3e2a72', C: '#e8c25a', c: '#a8842e', T: '#8a6a40', t: '#5a4428', O: '#8ff0ff', o: '#3ac0e8', F: '#4a3526', f: '#2e2016', M: '#b8645a' },
      rows: [
        '................................',
        '..............HH............O...',
        '.............HHHh..........oOO..',
        '............HHHHh..........OOo..',
        '............HHHHhh..........o...',
        '...........HHHHHhh..........T...',
        '..........HHHHYHHhh.........T...',
        '.........HHHHHHHHHhh........T...',
        '.....kkkhhhhhhhhhhhhhkkk....T...',
        '......kkkkkkkkkkkkkkkkk.....T...',
        '.........RSSSSSSSSSR........T...',
        '........RRSSWESSWESRR.......T...',
        '........RRSSEESSEESRR.......T...',
        '........RrSSSSSSSSSrR.......T...',
        '........RrsSSSMMSSsrR.......T...',
        '.........rRssSSSSssRr.......T...',
        '.........rRRRsssRRRr........T...',
        '.........BBBBRRRBBBB........T...',
        '........BBBBBBRBBBBBB.......T...',
        '.......BBBBBBCCBBBBBBB.....SSs..',
        '.......SSBBBBBCBBBBBBBSSSSSSSs..',
        '.......SSbBBBBCBBBBBBbs.....T...',
        '.......ssbBBBBCBBBBBBb......T...',
        '........bBBBBBBBBBBBBb......T...',
        '........bBBBBBBBBBBBBb......T...',
        '.......bbBBBBBBBBBBBBbb.....T...',
        '.......bbbBBBBBBBBBBbbb.....t...',
        '.......bbbbBBBBBBBBbbbb.........',
        '........bbbbbbbbbbbbbb..........',
        '.........FFFF....FFFF...........',
        '.........ffff....ffff...........',
        '................................'
      ],
      small: {
        pal: { H: '#6a4aa8', h: '#4a3080', S: SKIN, E: EYE, B: '#5a3e94', b: '#3e2a6a', C: '#e0b85a', W: '#8a6a40', O: '#7fe0ff', F: BOOT },
        rows: [
          '.......HH.......',
          '......HHHH......',
          '.....HHHHHH...O.',
          '...hhhhhhhhhh.OO',
          '....SSSSSSSS..W.',
          '....SSESSESS..W.',
          '....SSSSSSSS..W.',
          '.....SSSSSS...W.',
          '....BBBBBBBB..W.',
          '...BBBBCCBBBBSW.',
          '...BBBBCCBBBB.W.',
          '...BBBBBBBBBB.W.',
          '...bBBBBBBBBb...',
          '...bbBBBBBBbb...',
          '....bbbbbbbb....',
          '....FF....FF....'
        ]
      }
    },
    astrologer: {
      // 32×32（細かい版）。小さく表示するときは small（16×16）を使う
      pal: { H: '#2c3e7a', h: '#1e2b58', Y: '#f2d675', y: '#c8a040', S: '#f2cca4', s: '#d09a78', E: '#2a1f1a', W: '#ffffff', R: '#5a3420', B: '#3a4e98', b: '#26366e', C: '#e8c25a', D: '#9fc4ff', d: '#5a86d8', F: '#4a3526', f: '#2e2016', M: '#b8645a', L: '#d8dcf0' },
      rows: [
        '................................',
        '................................',
        '...........HHHHHHHHH............',
        '..........HHHHHYHHHHH...........',
        '.........HHHHHYYYHHHHH..........',
        '........HHHHHHHYHHHHHHH.........',
        '........hHHHHHHHHHHHHHh.........',
        '.......hhhhhhhhhhhhhhhhh........',
        '........hRRSSSSSSSSRRh..........',
        '........RRSSSSSSSSSSRR..........',
        '........RRSSWESSWESSRR..........',
        '........RRSSEESSEESSRR..........',
        '........RRsSSSSSSSSsRR..........',
        '.........RRsSSSMMSsRR...........',
        '.........RR.sSSSSs.RR...........',
        '..........LLLLLLLLLL............',
        '.........BBBBBLLBBBBB...........',
        '........BBBBBBYBBBBBBB..........',
        '.......BBBBBBBBBBBBBBBB.........',
        '......SSBBBYBBBBBBBYBBSS..DDd...',
        '......SSbBBBBBBBBBBBBbSSDDDDDd..',
        '.....DDdDbBBBBYBBBBBBb.DDdYdDDd.',
        '....DDDDDdbBBBBBBBBBBb..DDDDDDd.',
        '....DdYdDDbBBBBBBBBBBb...dDDDd..',
        '....DDDDDdbbBBBBBBBBbb....ddd...',
        '.....dDDdbbbBBBBBBBbbb..........',
        '......dd.bbbbBBBBBbbbb..........',
        '.........bbbbbbbbbbbbb..........',
        '..........bbbbbbbbbbb...........',
        '..........FFFF...FFFF...........',
        '..........ffff...ffff...........',
        '................................'
      ],
      small: {
        pal: { H: '#2c3e7a', h: '#1e2b58', Y: '#f2d675', S: SKIN, E: EYE, B: '#33468c', b: '#223266', W: '#c9a24a', D: '#8fb4ff', F: BOOT },
        rows: [
          '................',
          '.....HHHHHH.....',
          '....HHHYHHHH....',
          '...HHHHHHHHHH...',
          '...HSSSSSSSSH...',
          '...HSSESSESSH...',
          '...HSSSSSSSSH...',
          '....hSSSSSSh....',
          '.WW.BBBBBBBB....',
          'WDDWBBBYBBBBB...',
          'WDYWSBBBBBBBS...',
          '.WW.BBBBBBBB....',
          '....bBBBBBBb....',
          '....bbBBBBbb....',
          '....bbbbbbbb....',
          '....FF....FF....'
        ]
      }
    },
    thief: {
      // 32×32（細かい版）。小さく表示するときは small（16×16）を使う
      pal: { H: '#2e6a4a', h: '#1e4a32', S: '#f2cca4', s: '#d09a78', E: '#2a1f1a', W: '#ffffff', R: '#3a2a20', K: '#2a2e36', k: '#1a1c22', B: '#3a4048', b: '#262a30', L: '#6a4628', C: '#c8c8d0', c: '#8a8e9a', X: '#e8eef6', x: '#9aa6b8', F: '#3a2a1e', f: '#22180e', Y: '#c8962e', y: '#7a5a1e' },
      rows: [
        '................................',
        '................................',
        '...........HHHHHHHHH............',
        '..........HHHHHHHHHHH...........',
        '.........HHHHHHHHHHHHH..HH......',
        '.........HhhhhhhhhhhhH.HHh......',
        '.........RRRRRRRRRRRRRHHh.......',
        '.........RRSSSSSSSSSRRhh........',
        '.........RSSWESSSWESSR..........',
        '.........RSSEESSSEESSR..........',
        '.........KKKKKKKKKKKKK..........',
        '.........kKKKKKKKKKKKk..........',
        '..........kKKKKKKKKKk...........',
        '...........kkKKKKKkk............',
        '..........BBBBBkkBBBBB..........',
        '.........BBBBBBBBBBBBBB.........',
        '........BBBBBBBBBBBBBBBB........',
        '...X....BbBBBBBBBBBBBBbB........',
        '...Xx..SSbBBBBBBBBBBBBbSS.......',
        '...Xx.SSSbBBBBBBBBBBBBbSSS......',
        '...XxSSS.LLLLLLYLLLLLLL.SS.X....',
        '..yYYy...bBBBBBBBBBBBBb...SXx...',
        '...Y.....bBBBBBBBBBBBBb...SXx...',
        '.........bbBBBBBBBBBBbb..yYYy...',
        '..........KKKKKKKKKKKK.....Y....',
        '..........KKKKk..kKKKK..........',
        '..........KKKKk..kKKKK..........',
        '..........kKKKk..kKKKk..........',
        '.........FFFFFf..FFFFFf.........',
        '.........fffffF..fffffF.........',
        '................................',
        '................................'
      ],
      small: {
        pal: { H: '#3e8a5a', h: '#2a6040', S: SKIN, E: EYE, B: '#3a3f4a', b: '#262a33', C: '#7a5a3a', W: '#cfd6de', F: BOOT, M: '#2a6040' },
        rows: [
          '................',
          '....HHHHHHHH....',
          '...HHHHHHHHHHh..',
          '....SSSSSSSS..h.',
          '....SEESSEES....',
          '....MMMMMMMM....',
          '.....MMMMMM.....',
          '....BBBBBBBB....',
          '...BBBCBBBBBB...',
          '...SBBBCBBBBSW..',
          '...BBBBBCBBB.W..',
          '....bbbbbbbb....',
          '....BBBBBBBB....',
          '....BB....BB....',
          '....BB....BB....',
          '...FFF....FFF...'
        ]
      }
    },
    archer: {
      // 32×32（細かい版）。小さく表示するときは small（16×16）を使う
      pal: { H: '#4a8a3a', h: '#2e6024', S: '#f2cca4', s: '#d09a78', E: '#2a1f1a', W: '#ffffff', R: '#c8a050', r: '#9a7630', B: '#3e7a3a', b: '#2a5a28', L: '#6a4628', l: '#4a3018', T: '#8a6236', t: '#5a3e20', Q: '#a8763a', q: '#6e4a22', A: '#e8eef6', Z: '#d84a3a', G: '#5a4a32', g: '#3e3222', F: '#5a3a20', f: '#3a2414', M: '#b8645a', C: '#e8c25a' },
      rows: [
        '................................',
        '..............HHH...............',
        '............HHHHHHH.......T.....',
        '...........HHHHHHHHH......Tt....',
        '..........HHHHHHHHHHHZ.....Tt...',
        '.........hHHHHHHHHHHHZZ.....T...',
        '.........hRRRRRRRRRRRh......Tt..',
        '.........RRSSSSSSSSSRR......AT..',
        '.........RSSWESSSWESSR.......T..',
        '.........RSSEESSSEESSR.......T..',
        '.........RrSSSSSSSSSrR.......T..',
        '..........rsSSSMMSSsr........T..',
        '...........ssSSSSSss.........T..',
        '..qQQ.....BBBBsssBBBB........T..',
        '..qQQ....BBBBBBBBBBBBB.......T..',
        '..qQQ...BBBBBBLBBBBBBBB......T..',
        '..qQQ...BbBBBBBLBBBBBBB......T..',
        '..qQQ..SSbBBBBBBLBBBBbSS.....T..',
        '..qQQ..SSbBBBBBBBLBBBbSSSSSSSS..',
        '...AA..ssbBBBBBBBBLBBbs......T..',
        '...A.....LLLLLLCLLLLLl.......T..',
        '.........bBBBBBBBBBBBb......Tt..',
        '.........bbBBBBBBBBBbb......T...',
        '..........GGGGGGGGGGG.....Tt....',
        '..........GGGGg.gGGGG.....T.....',
        '..........GGGGg.gGGGG...........',
        '..........gGGGg.gGGGg...........',
        '.........FFFFFf.FFFFFf..........',
        '.........FFFFFf.FFFFFf..........',
        '.........fffffF.fffffF..........',
        '................................',
        '................................'
      ],
      small: {
        pal: { H: '#6a8a3a', h: '#4a6428', S: SKIN, E: EYE, B: '#5a7a34', b: '#405a24', C: '#8a6a40', W: '#a07a4a', T: '#e8e0c8', F: BOOT },
        rows: [
          '................',
          '.....HHHHHH.....',
          '....HHHHHHHH....',
          '...HHSSSSSSHH...',
          '...HSSESSESSH.W.',
          '....SSSSSSSS.TW.',
          '.....SSSSSS..T.W',
          '....BBBBBBBB.T.W',
          '...BBBBBBBBBST.W',
          '...SBBCCCCBB.T.W',
          '...BBBBBBBBB.TW.',
          '....bbbbbbbb.W..',
          '....BBBBBBBB....',
          '....BB....BB....',
          '....BB....BB....',
          '...FFF....FFF...'
        ]
      }
    },
    priest: {
      // 32×32（細かい版）。小さく表示するときは small（16×16）を使う
      pal: { H: '#f4f0e6', h: '#c8c0ae', k: '#9a927e', Y: '#e8c25a', y: '#a8842e', S: '#f2cca4', s: '#d09a78', E: '#2a1f1a', W: '#ffffff', R: '#e0c890', B: '#f4f0e6', b: '#c8c0ae', d: '#9a927e', C: '#e8c25a', c: '#a8842e', T: '#c8962e', t: '#7a5a1e', O: '#fff2b0', F: '#8a6a48', f: '#5a4428', M: '#b8645a' },
      rows: [
        '..........................O.....',
        '.........................OYO....',
        '..........................Y.....',
        '...........HHHHHHHH......YYY....',
        '..........HHHHYYHHHH......T.....',
        '.........HHHHHYYHHHHH.....T.....',
        '.........HHHYYYYYYHHH.....T.....',
        '.........HHHHHYYHHHHH.....T.....',
        '.........hHHHHYYHHHHh.....T.....',
        '.........hHSSSSSSSSHh.....T.....',
        '.........hSSWESSWESSh.....T.....',
        '.........hSSEESSEESSh.....T.....',
        '.........hsSSSSSSSSsh.....T.....',
        '..........sSSSMMSSSs......T.....',
        '..........hssSSSSsshh.....T.....',
        '.........hHHHHHHHHHHHh....T.....',
        '........HHHHHHYHHHHHHHH...T.....',
        '.......BBBBBBBYBBBBBBBBB.SSs....',
        '.......BBBBBBYYYBBBBBBBSSSSs....',
        '......SSBBBBBBYBBBBBBBbB..T.....',
        '......SSbBBBBBYBBBBBBBbB..T.....',
        '......ssbBBBBBBBBBBBBBb...T.....',
        '.......bbBBBBBBBBBBBBBb...T.....',
        '.......bbBBBBBBBBBBBBBbb..T.....',
        '.......bbbBBBBBBBBBBBBbb..T.....',
        '......dbbbBBBBBBBBBBBbbbd.T.....',
        '......ddbbbBBBBBBBBBbbbdd.t.....',
        '.......ddbbbbbbbbbbbbbdd........',
        '........dddddddddddddd..........',
        '..........FFFF...FFFF...........',
        '..........ffff...ffff...........',
        '................................'
      ],
      small: {
        pal: { H: '#e8e4da', h: '#bdb6a6', Y: '#e0b85a', S: SKIN, E: EYE, B: '#e8e4da', b: '#bdb6a6', W: '#c9a24a', O: '#c9a8ff', F: BOOT },
        rows: [
          '..............O.',
          '.....HHHHHH..OYO',
          '....HHHYHHHH..W.',
          '...HHHHYHHHHH.W.',
          '...HSSSSSSSSH.W.',
          '...HSSESSESSH.W.',
          '...hSSSSSSSSh.W.',
          '....hSSSSSSh..W.',
          '....BBBBBBBB..W.',
          '...BBBBYBBBBBSW.',
          '...BBBYYYBBBB.W.',
          '...BBBBYBBBBB...',
          '...bBBBBBBBBb...',
          '...bbBBBBBBbb...',
          '....bbbbbbbb....',
          '....FF....FF....'
        ]
      }
    },

    // ===== 敵 =====
    slime: {
      pal: { G: '#5cc46a', g: '#3a9a4a', L: '#a8f0b0', E: '#1a2a1a' },
      rows: [
        '................',
        '................',
        '................',
        '................',
        '.......GG.......',
        '......GGGG......',
        '.....GGLGGG.....',
        '....GGLLGGGG....',
        '...GGGGGGGGGG...',
        '...GGEGGGGEGG...',
        '..GGGEGGGGEGGG..',
        '..GGGGGGGGGGGG..',
        '..GGGGGGGGGGGG..',
        '..gGGGGGGGGGGg..',
        '...gggggggggg...',
        '................'
      ]
    },
    bat: {
      pal: { B: '#6a4a8a', b: '#4a3066', E: '#ff5a5a', W: '#e8e0c8' },
      rows: [
        '................',
        '................',
        '................',
        'b.............b.',
        'bb...B...B...bb.',
        'bBb..BB.BB..bBb.',
        'bBBb.BBBBB.bBBb.',
        'bBBBbBEBEBbBBBb.',
        'bBBBBBBBBBBBBBb.',
        '.bBBBBWBWBBBBb..',
        '..bBb.BBB.bBb...',
        '...b..bBb..b....',
        '.......b........',
        '................',
        '................',
        '................'
      ]
    },
    wolf: {
      pal: { G: '#7a8494', g: '#58606e', L: '#a8b0bc', E: '#ffcf4a', T: '#e8e0c8', N: '#22252c' },
      rows: [
        '................',
        '................',
        '..G.G...........',
        '..GGG...........',
        '.GGEGG..........',
        'NGGGGGG.........',
        '.TLGGGGGGGGGG...',
        '..LLGGGGGGGGGG.g',
        '...GGGGGGGGGGGgg',
        '...GGGGGGGGGGG..',
        '...gGG.gggg.GG..',
        '...gG..g..g.gG..',
        '...gG..g..g.gG..',
        '..ggg.gg.gg.ggg.',
        '................',
        '................'
      ]
    },
    spider: {
      pal: { B: '#3a2e44', b: '#2a2030', R: '#c8484a', E: '#ff7a5a', L: '#5a4a66' },
      rows: [
        '................',
        '................',
        '................',
        '..L..........L..',
        '...L...BB...L...',
        '....L.BBBB.L....',
        'L....BBRRBB....L',
        '.LLLLBBBBBBLLLL.',
        '....BBBBBBBB....',
        '.LLLBBEBBEBBLLL.',
        'L...BBBBBBBB...L',
        '...L.bBBBBb.L...',
        '..L...bbbb...L..',
        '.L............L.',
        '................',
        '................'
      ]
    },
    golem: {
      pal: { R: '#8a7a6a', r: '#665a4e', D: '#4a4038', E: '#ffb03a', M: '#5ac8a8' },
      rows: [
        '................',
        '.....RRRRRR.....',
        '....RRRRRRRR....',
        '....RREEREER....',
        '....RRRRRRRR....',
        '..RRRrRRRRrRRR..',
        '.RRRRRRMMRRRRRR.',
        'RRRrRRRMMRRRrRRR',
        'RRR.RRRRRRRR.RRR',
        'RRR.RRRrRRRR.RRR',
        'rrr.RRRRRRRR.rrr',
        '....RRRRRRRR....',
        '....RRR..RRR....',
        '....rRR..RRr....',
        '...DDDD..DDDD...',
        '................'
      ]
    },
    treant: {
      pal: { L: '#4a8a3a', l: '#2e6428', T: '#7a5a3a', t: '#5a4028', E: '#ffd25a' },
      rows: [
        '.....LLLLL......',
        '...LLLLLLLLL....',
        '..LLLlLLLLlLL...',
        '..LLLLLLLLLLLL..',
        '...LLLlLLLLLL...',
        '.....TTTTTT.....',
        '.T...TETTET...T.',
        '..T..TTTTTT..T..',
        '...TTTttttTTT...',
        '.....TTTTTT.....',
        '.....TTTTTT.....',
        '.....TTttTT.....',
        '.....TTTTTT.....',
        '....TT.TT.TT....',
        '...tT..TT..Tt...',
        '..tt..tttt..tt..'
      ]
    },
    hornet: {
      pal: { Y: '#f2c43a', K: '#2a2420', W: '#d8e8f0', E: '#c83a3a', S: '#e8e0c8' },
      rows: [
        '................',
        '................',
        '.....WW..WW.....',
        '....WWWW.WWWW...',
        '.....WWWWWWW....',
        '..KK..WWWWW.....',
        '.KEKK.YYYY......',
        '.KKKKYKKKKYY....',
        '..KK.YYYYYYYY...',
        '.....KKKKKKKKK..',
        '......YYYYYYYY..',
        '.......KKKKKKS..',
        '........YYYYSS..',
        '...........SS...',
        '................',
        '................'
      ]
    },
    elder_tree: {
      pal: { L: '#3a7a40', l: '#245a2c', P: '#c87ab8', T: '#6a4a2e', t: '#4a3220', E: '#ff6a3a' },
      rows: [
        '...LLLLLLLLLL...',
        '.LLLLPLLLLLPLLL.',
        'LLLlLLLLLLlLLLLL',
        'LLLLLLLLPLLLLLlL',
        '.LLlLLLLLLLLLLL.',
        '...LLLTTTTLLL...',
        'T....TTTTTT....T',
        '.T..TEETTEET..T.',
        '..TTTTTTTTTTTT..',
        '....TTttttTT....',
        '....TTtTTtTT....',
        '....TTTTTTTT....',
        '....TTTTTTTT....',
        '...TTT.TT.TTT...',
        '..tTT..TT..TTt..',
        '.ttt..tttt..ttt.'
      ]
    },
    toad: {
      pal: { G: '#6a9a4a', g: '#4a7034', P: '#a85aa8', E: '#ffe05a', K: '#1a1a1a', B: '#c8d08a' },
      rows: [
        '................',
        '................',
        '................',
        '................',
        '...GG......GG...',
        '..GEKG....GKEG..',
        '..GGGGGGGGGGGG..',
        '.GGGPGGGGGGPGGG.',
        '.GGGGGGGGGGGGGG.',
        '.GKKKKKKKKKKKKG.',
        '.GBBBBBBBBBBBBG.',
        'gGGBBBBBBBBBBGGg',
        'gg.GGGGGGGGGG.gg',
        'gg..gg....gg..gg',
        '................',
        '................'
      ]
    },
    wisp: {
      pal: { B: '#5ab4ff', b: '#2a7ad0', W: '#e0f4ff', E: '#1a2a4a' },
      rows: [
        '................',
        '.......B........',
        '......BB........',
        '.....BBB..B.....',
        '.....BBBB.BB....',
        '....BBWBBBBB....',
        '....BWWWBBBB....',
        '...BBWWWWBBBB...',
        '...BWEWWEWBBB...',
        '...BWWWWWWWBB...',
        '...BBWWWWWBBB...',
        '....BBWWWBBB....',
        '.....BBBBBb.....',
        '......bbbb......',
        '................',
        '................'
      ]
    },
    marsh_queen: {
      pal: { P: '#7a4a9a', p: '#5a3274', Y: '#e0c85a', E: '#7aff7a', S: '#b48ac8', T: '#3a6a5a' },
      rows: [
        '....Y.Y.Y.......',
        '....YYYYY.......',
        '...PPPPPPP......',
        '...PEPPPEP......',
        '...PPPPPPP......',
        '....PSSSP.......',
        '..PPPPPPPPP.....',
        '.PPPPSSSPPPP....',
        '.PP.PSSSP.PP....',
        '....PPPPPP......',
        '.....PPPPPP.....',
        '......pPPPPP....',
        '..TT...ppPPPP...',
        '.TTTTT...pPPPP..',
        'TTTTTTTTTTpPPP..',
        'TTTTTTTTTTTTpp..'
      ]
    },
    gargoyle: {
      pal: { G: '#7e8590', g: '#5a606a', E: '#ff4a4a', W: '#4a5058' },
      rows: [
        '................',
        '...G........G...',
        '...GG......GG...',
        'W...GGGGGGGG...W',
        'WW..GEGGGGEG..WW',
        'WWW.GGGGGGGG.WWW',
        'WWWW.GGggGG.WWWW',
        'WWWWGGGGGGGGWWWW',
        '.WWGGGGGGGGGGWW.',
        '..W.GGGGGGGG.W..',
        '....GGGGGGGG....',
        '....GG.gg.GG....',
        '...gGG....GGg...',
        '..ggg......ggg..',
        '................',
        '................'
      ]
    },
    phantom: {
      pal: { A: '#8aa0c8', a: '#5a6e94', E: '#7affff', S: '#c8d4e8', K: '#2a3048' },
      rows: [
        '.....AAAAAA.....',
        '....AAAAAAAA....',
        '....AKKKKKKA....',
        '....AKEKKEKA..S.',
        '....AKKKKKKA..S.',
        '.....AAAAAA...S.',
        '...AAAAAAAAAA.S.',
        '..AAaAAAAAAaAAS.',
        '..AA.AAAAAA.AAS.',
        '.....AAAAAA..SSS',
        '.....aAAAAa.....',
        '.....aAAAAa.....',
        '....aaAAAAaa....',
        '...a.a.aa.a.a...',
        '..a...a..a...a..',
        '................'
      ]
    },
    rock_doll: {
      pal: { R: '#9a8a74', r: '#6e6252', E: '#5ad0ff' },
      rows: [
        '................',
        '................',
        '................',
        '.....RRRRR......',
        '....RRRRRRR.....',
        '....RERRERR.....',
        '....RRRRRRR.....',
        '..RRRRrRRRRRR...',
        '.RRR.RRRRR.RRR..',
        '.RR..RRrRR..RR..',
        '.rr..RRRRR..rr..',
        '.....RR.RR......',
        '.....RR.RR......',
        '....rrr.rrr.....',
        '................',
        '................'
      ]
    },
    star_dragon: {
      pal: { D: '#2a3a7a', d: '#1a2658', Y: '#f2d675', E: '#ff5a5a', W: '#4a5ab0', T: '#e8e0c8' },
      rows: [
        '..Y.......Y.....',
        '..DD.....DD.....',
        '...DDDDDDD......',
        '..DDEDDDDED.....',
        '..DDDDDDDDDD....',
        '..DTTDDDDTTD.W..',
        '...DDDDDDDD.WWW.',
        'W...DDYDDD.WWWWW',
        'WW.DDDDDDDDWWWW.',
        'WWWDDYDDDYDDWW..',
        '.WWDDDDDDDDDD...',
        '...DDDYDDDDDDD..',
        '...DDDDDDDDDDDD.',
        '..dDD.dd.DDd.dDD',
        '.ddd..dd..ddd..d',
        '................'
      ]
    },

    // ===== メニューのアイコン =====
    icon_dungeon: {
      pal: { S: '#6a6f7a', s: '#4a4e58', D: '#3a2a1e', d: '#5a4030', Y: '#e0b85a' },
      rows: [
        '................',
        '....SSSSSSSS....',
        '...SSsSSSSsSS...',
        '..SSSSDDDDSSSS..',
        '..SsSDDddDDSsS..',
        '..SSDDddddDDSS..',
        '..SSDdddddDdSS..',
        '..SsDdddddddSS..',
        '..SSDddddYddSs..',
        '..SSDdddddddSS..',
        '..SsDdddddddSS..',
        '..SSDdddddddsS..',
        '..SSDdddddddSS..',
        '.SSSSSSSSSSSSSS.',
        '.ssssssssssssss.',
        '................'
      ]
    },
    icon_equip: {
      pal: { W: '#dfe6ee', w: '#a0a8b4', G: '#c9a24a', H: '#6a4a2e' },
      rows: [
        '............WW..',
        '...........WWw..',
        '..........WWw...',
        '.........WWw....',
        '........WWw.....',
        '.......WWw......',
        '......WWw.......',
        '.....WWw........',
        '..G.WWw.........',
        '...GWw..........',
        '...GG...........',
        '..H.GG..........',
        '.H...G..........',
        'H...............',
        '................',
        '................'
      ]
    },
    icon_craft: {
      pal: { M: '#9aa3b5', m: '#6b7385', H: '#8a6a40', h: '#6a4a2e', A: '#4a4e58', a: '#33363e', F: '#ff9a3a' },
      rows: [
        '................',
        '..MMMMMM........',
        '..MmmmmM........',
        '..MMMMMM.F......',
        '.....H....F.....',
        '.....H...F......',
        '.....h..........',
        '.....H..........',
        '.....h..........',
        '..AAAAAAAAAA....',
        '...AAAAAAAAAAA..',
        '....aAAAAAAa....',
        '.....AAAAAA.....',
        '....aaaaaaaa....',
        '...aaaaaaaaaa...',
        '................'
      ]
    },
    icon_bag: {
      pal: { B: '#8a6a40', b: '#6a4a2e', Y: '#e0b85a', S: '#5a4030' },
      rows: [
        '................',
        '......SSSS......',
        '.....S....S.....',
        '......SSSS......',
        '.....BBBBBB.....',
        '....BBBBBBBB....',
        '...BBBBYYBBBB...',
        '..BBBBBYYBBBBB..',
        '..BBBBBBBBBBBB..',
        '..BBBBBBBBBBBB..',
        '..BbBBBBBBBBbB..',
        '..BBBBBBBBBBBB..',
        '...BBBBBBBBBB...',
        '....bbbbbbbb....',
        '................',
        '................'
      ]
    },
    icon_practice: {
      pal: { R: '#c8484a', W: '#e8e0c8', H: '#8a6a40' },
      rows: [
        '................',
        '.....RRRRRR.....',
        '....RWWWWWWR....',
        '...RWRRRRRRWR...',
        '...RWRWWWWRWR...',
        '...RWRWRRWRWR...',
        '...RWRWRRWRWR...',
        '...RWRWWWWRWR...',
        '...RWRRRRRRWR...',
        '....RWWWWWWR....',
        '.....RRRRRR.....',
        '.......HH.......',
        '.......HH.......',
        '......HHHH......',
        '.....HHHHHH.....',
        '................'
      ]
    },
    icon_sim: {
      pal: { G: '#5cc46a', Y: '#e0b85a', B: '#5ab4ff', A: '#6a6f7a' },
      rows: [
        '................',
        '..A.............',
        '..A.........YY..',
        '..A.........YY..',
        '..A.........YY..',
        '..A......BB.YY..',
        '..A......BB.YY..',
        '..A..GG..BB.YY..',
        '..A..GG..BB.YY..',
        '..A..GG..BB.YY..',
        '..A..GG..BB.YY..',
        '..AAAAAAAAAAAAA.',
        '................',
        '................',
        '................',
        '................'
      ]
    },

    // ===== 小さなアイコン（ステータス・カードの種類など） =====
    ico_hp: {
      pal: { R: '#e05a4e', r: '#a83a32', W: '#ffb0a0' },
      rows: ['................', '................', '................', '...RRR...RRR....', '..RWWRR.RRRRR...', '..RWRRRRRRRRR...', '..RRRRRRRRRRR...', '..RRRRRRRRRRR...', '...RRRRRRRRR....', '....RRRRRRR.....', '.....RRRRR......', '......rRr.......', '.......r........', '................', '................', '................']
    },
    ico_atk: {
      pal: { W: '#dfe6ee', w: '#9aa3b0', G: '#d6b25e', H: '#7a5a3a' },
      rows: ['................', '...........WW...', '..........WWw...', '.........WWw....', '........WWw.....', '.......WWw......', '......WWw.......', '..G..WWw........', '...GWWw.........', '....GG..........', '...HGG..........', '..H...G.........', '.H..............', '................', '................', '................']
    },
    ico_def: {
      pal: { B: '#6a9be0', b: '#3a6aa8', W: '#c8dcff', G: '#d6b25e' },
      rows: ['................', '...GGGGGGGGG....', '...GBBBBBBBG....', '...GBWWBBBBG....', '...GBWBBBBBG....', '...GBBBBBBBG....', '...GBBBBBBbG....', '...GBBBBBBbG....', '....GBBBBbG.....', '....GBBBbbG.....', '.....GBbbG......', '......GGG.......', '.......G........', '................', '................', '................']
    },
    ico_mag: {
      pal: { P: '#a58ae6', p: '#6a4ab0', W: '#f0e8ff', G: '#d6b25e' },
      rows: ['................', '................', '.....PPPPP......', '....PWWPPPP.....', '...PWWPPPPPP....', '...PWPPPPPPP....', '...PPPPPPPPp....', '...PPPPPPPPp....', '....PPPPPPp.....', '.....ppppp......', '......GGG.......', '.....GGGGG......', '................', '................', '................', '................']
    },
    ico_block: {
      pal: { B: '#6a9be0', b: '#3a6aa8', W: '#c8dcff' },
      rows: ['................', '................', '....BBBBBBBB....', '....BWWBBBBB....', '....BWBBBBBB....', '....BBBBBBBB....', '....BBBBBBbB....', '.....BBBBBb.....', '.....BBBBbb.....', '......BBbb......', '.......Bb.......', '................', '................', '................', '................', '................']
    },
    ico_ward: {
      pal: { P: '#b39cf0', p: '#7a62c0', W: '#efe6ff' },
      rows: ['................', '.......PP.......', '.....PPWWPP.....', '....PWW..WPP....', '...PW......PP...', '...PW......pP...', '...P........P...', '...P........p...', '...PP......pP...', '....PP....pP....', '.....PPppPP.....', '.......PP.......', '................', '................', '................', '................']
    },
    ico_type_attack: {
      pal: { W: '#f0d8d0', w: '#c09a90', R: '#c4473d' },
      rows: ['................', '..WW........WW..', '..WWw......wWW..', '...WWw....wWW...', '....WWw..wWW....', '.....WWwwWW.....', '......WWWW......', '......WWWW......', '.....WWwwWW.....', '....RRw..wRR....', '...RRw....wRR...', '..RR........RR..', '.RR..........RR.', '................', '................', '................']
    },
    ico_type_skill: {
      pal: { B: '#9ab8e8', b: '#5a7ab0', W: '#e0ecff' },
      rows: ['................', '................', '...BBBBBBBBBB...', '...BWWBBBBBBB...', '...BWBBBBBBBB...', '...BBBBBBBBBB...', '...BBBBBBBBbB...', '...BBBBBBBBbB...', '....BBBBBBbB....', '.....BBBBbB.....', '......BBbB......', '.......BB.......', '................', '................', '................', '................']
    },
    ico_type_power: {
      pal: { Y: '#f2d675', y: '#c9a24a', W: '#fff6d0' },
      rows: ['................', '.......YY.......', '.......YY.......', '......YWWY......', '......YWWY......', 'YYYYYYYWWYYYYYYY', '.YYYYWWWWWWYYYY.', '...YYYWWWWYYY...', '....YYYWWYYY....', '....YYYYYYYY....', '...YYYy..yYYY...', '...YYy....yYY...', '..YYy......yYY..', '..Yy........yY..', '................', '................']
    },

    // ===== 素材の種類 =====
    mat_ore: {
      pal: { R: '#7a7480', r: '#55505a', C: '#d88a4a', B: '#8ad0ff' },
      rows: [
        '................',
        '................',
        '................',
        '......RRRR......',
        '....RRRRRRRR....',
        '...RRCRRRRBRR...',
        '..RRRCCRRRRRRR..',
        '..RRRRRRRRCRRR..',
        '..RRBRRRRRRRRR..',
        '..rRRRRCRRRRRr..',
        '...rrRRRRRRrr...',
        '....rrrrrrrr....',
        '................',
        '................',
        '................',
        '................'
      ]
    },
    mat_wood: {
      pal: { T: '#8a6a40', t: '#6a4a2e', R: '#c8a070', r: '#a07a50' },
      rows: [
        '................',
        '................',
        '................',
        '................',
        '..TTTTTTTTTTRR..',
        '.TTTTTTTTTTRrrR.',
        '.TtTTTTTtTTRrRR.',
        '.TTTTtTTTTTRrrR.',
        '.TTTTTTTTTTRRRR.',
        '..tttttttttRRR..',
        '................',
        '................',
        '................',
        '................',
        '................',
        '................'
      ]
    },
    mat_plant: {
      pal: { G: '#5cc46a', g: '#3a8a4a', S: '#4a6a2a' },
      rows: [
        '................',
        '................',
        '..........GG....',
        '........GGGGG...',
        '.......GGgGGG...',
        '......GGgGGG....',
        '.....GGgGGG.....',
        '..GG.GgGG.......',
        '.GGGGgGG........',
        '.GGgGSG.........',
        '..GGGS..........',
        '.....S..........',
        '....S...........',
        '................',
        '................',
        '................'
      ]
    },
    mat_monster: {
      pal: { W: '#e8e0c8', w: '#b8ae94' },
      rows: [
        '................',
        '................',
        '..........WW....',
        '.........WWWW...',
        '........WWWWW...',
        '.......WWWWw....',
        '......WWWWw.....',
        '.....WWWWw......',
        '....WWWWw.......',
        '...WWWWw........',
        '..WWWWw.........',
        '..WWww..........',
        '...w............',
        '................',
        '................',
        '................'
      ]
    },
    mat_gem: {
      pal: { B: '#8ad0ff', b: '#4a90d0', W: '#e8f8ff' },
      rows: [
        '................',
        '................',
        '................',
        '.....BBBBBB.....',
        '....BWBBBBbB....',
        '...BWWBBBBBbB...',
        '...BBBBBBBBBB...',
        '....BBBBBBbB....',
        '.....BBBBbB.....',
        '......BBbB......',
        '.......BB.......',
        '................',
        '................',
        '................',
        '................',
        '................'
      ]
    },

    // ===== カードの絵（モチーフ） =====
    art_slash: {
      pal: { W: '#ffffff', w: '#c8e0ff', b: '#6a9ad8' },
      rows: [
        '................',
        '.............ww.',
        '............wWw.',
        '...........wWw..',
        '..........wWw...',
        '.........wWw....',
        '........wWw.....',
        '.......wWw......',
        '......wWw.......',
        '.....wWw........',
        '....wWw.........',
        '...wWw..........',
        '..wWw...........',
        '..ww............',
        '.b..............',
        '................'
      ]
    },
    art_slash2: {
      pal: { W: '#ffffff', w: '#c8e0ff', b: '#6a9ad8' },
      rows: [
        '................',
        '..........ww....',
        '.........wWw..ww',
        '........wWw..wWw',
        '.......wWw..wWw.',
        '......wWw..wWw..',
        '.....wWw..wWw...',
        '....wWw..wWw....',
        '...wWw..wWw.....',
        '..wWw..wWw......',
        '..ww..wWw.......',
        '.....wWw........',
        '.....ww.........',
        '....b...........',
        '................',
        '................'
      ]
    },
    art_sweep: {
      pal: { W: '#ffffff', w: '#c8e0ff', b: '#6a9ad8' },
      rows: [
        '................',
        '................',
        '.....wwwwww.....',
        '...wwWWWWWWww...',
        '..wWWwwwwwwWWw..',
        '.wWw........wWw.',
        '.wW..........Ww.',
        'wW............w.',
        'w...............',
        '................',
        '.b..b..b..b..b..',
        '................',
        '................',
        '................',
        '................',
        '................'
      ]
    },
    art_impact: {
      pal: { W: '#ffffff', Y: '#ffe08a', O: '#ff9a3a', o: '#c85a1a' },
      rows: [
        '.......Y........',
        '.......Y....Y...',
        '..Y....Y...Y....',
        '...Y..OOO.Y.....',
        '....YOOWOOY.....',
        '....OOWWWOO.....',
        '.YYOOWWWWWOOYY..',
        '....OOWWWOO.....',
        '....YOOWOOY.....',
        '...Y..OOO..Y....',
        '..Y....Y....Y...',
        '.......Y........',
        '.......o........',
        '................',
        '................',
        '................'
      ]
    },
    art_fire: {
      pal: { Y: '#fff2a8', O: '#ffb43a', R: '#ff6a1a', r: '#c83a10', d: '#7a1e08' },
      rows: [
        '.......R........',
        '......RR........',
        '......RRR...R...',
        '.....RRORR..RR..',
        '.....ROOR..RRR..',
        '....RROOORRROR..',
        '...RROOYOORROOR.',
        '...ROOYYYOOOOR..',
        '..RROOYYYYOOORR.',
        '..ROOYYYYYYOOOR.',
        '..ROOYYYYYYYOOR.',
        '..rROOYYYYYOORr.',
        '...rROOOOOOORr..',
        '....rrRRRRRrr...',
        '.....ddddddd....',
        '................'
      ]
    },
    art_ice: {
      pal: { W: '#ffffff', C: '#bff0ff', c: '#6ac8f0', b: '#2a7ac0' },
      rows: [
        '.......W........',
        '......WCc.......',
        '......CCc.......',
        '.....WCCcc......',
        '.....CCCcc...W..',
        '..W..CCCcc..Cc..',
        '.CCc.CCCcc.CCc..',
        '.CCcCCCCccCCc...',
        '..CcCCCCcccc....',
        '...CCCCCccc.....',
        '....CCCccc......',
        '....bCCccb......',
        '.....bccb.......',
        '......bb........',
        '................',
        '................'
      ]
    },
    art_bolt: {
      pal: { W: '#ffffff', Y: '#fff27a', y: '#e8b82a', o: '#a8781a' },
      rows: [
        '.........YYY....',
        '........YYYy....',
        '.......YYYy.....',
        '......YYYy......',
        '.....YYYy.......',
        '....YYYYYYYY....',
        '....yyyYYYYy....',
        '.......YYYy.....',
        '......YYYy......',
        '.....YYWy.......',
        '....YYWy........',
        '...YWWy.........',
        '...YWy..........',
        '..YWy...........',
        '..Yy............',
        '................'
      ]
    },
    art_orb: {
      pal: { W: '#ffffff', P: '#d8a8ff', p: '#a868f0', d: '#6a38b8', D: '#3e1e7a' },
      rows: [
        '.............W..',
        '............WWW.',
        '......dddd...W..',
        '....ddppppdd....',
        '...dpPPPppppd...',
        '...dpPWPPpppd...',
        '..dpPWWPPppppd..',
        '..dpPPPPPppppd..',
        '..dppPPPppppdd..',
        '..dpppppppppdd..',
        '...dppppppppd...',
        '...ddppppppdd...',
        '....ddddddddD...',
        '......DDDD......',
        '..W.............',
        '.WWW............'
      ]
    },
    art_beam: {
      pal: { W: '#ffffff', Y: '#ffe88a', y: '#e8c25a', o: '#a8842e' },
      rows: [
        '................',
        '.......W........',
        '.......Y........',
        '......YYY.......',
        '..YYYYYWYYYYY...',
        '...yYYWWWYYy....',
        '.....YWWWY......',
        '....YYYWYYY.....',
        '....YY.Y.YY.....',
        '...Y.......Y....',
        '................',
        'WWWWWWWWWWWWWWWW',
        'YYYYYYYYYYYYYYYY',
        'yyyyyyyyyyyyyyyy',
        '................',
        '................'
      ]
    },
    art_comet: {
      pal: { W: '#ffffff', Y: '#ffe88a', y: '#e8c25a', b: '#8ab0ff', B: '#4a6ad8' },
      rows: [
        '................',
        '................',
        '..........WW....',
        '.........WWWY...',
        '........bWWYY...',
        '.......bbWYy....',
        '......bBbYy.....',
        '.....bBb.y......',
        '....bBb.........',
        '...bBb....WW....',
        '..bBb....WWWY...',
        '.bBb....bWYy....',
        '.Bb....bBby.....',
        '......bBb.......',
        '.....Bb.........',
        '................'
      ]
    },
    art_dagger: {
      pal: { W: '#ffffff', w: '#c8d0dc', x: '#7a8496', Y: '#c8962e', y: '#7a5a1e' },
      rows: [
        '................',
        '.............W..',
        '............Ww..',
        '...........Ww...',
        '..........Wwx...',
        '.........Wwx....',
        '........Wwx.....',
        '.......Wwx......',
        '......Wwx.......',
        '...YyYwx........',
        '....YYx.........',
        '....yYY.........',
        '...y..YY........',
        '..y...yY........',
        '.y..............',
        '................'
      ]
    },
    art_arrow: {
      pal: { W: '#ffffff', x: '#9aa6b8', T: '#a8763a', t: '#6e4a22', R: '#d84a3a', r: '#9a2e26' },
      rows: [
        '................',
        '...........xWW..',
        '...........xWWW.',
        '............xWW.',
        '...........Tt.x.',
        '..........Tt....',
        '.........Tt.....',
        '........Tt......',
        '.......Tt.......',
        '......Tt........',
        '.....Tt.........',
        '..RrTt..........',
        '..RRt...........',
        '..rRR...........',
        '...rr...........',
        '................'
      ]
    },
    art_arrows: {
      pal: { W: '#ffffff', x: '#9aa6b8', T: '#a8763a', t: '#6e4a22', R: '#d84a3a' },
      rows: [
        '................',
        '.......xW...xW..',
        '......xWW..xWW..',
        '......TWx..TWx..',
        '.....Tt...Tt....',
        '....Tt...Tt.....',
        '...Tt.xW.Tt.....',
        '..Tt.xWW.t......',
        '..RR.TWx........',
        '..R.Tt..........',
        '...Tt...........',
        '..Tt............',
        '.RR.............',
        '.R..............',
        '................',
        '................'
      ]
    },
    art_rain: {
      pal: { W: '#ffffff', x: '#9aa6b8', T: '#a8763a' },
      rows: [
        '..T....T....T...',
        '..T....T....T...',
        '..T..T.T..T.T...',
        '..T..T.T..T.T...',
        '..x..T.x..T.x...',
        '..W..T.W..T.W...',
        '.....x....x.....',
        '.T...W..T.W..T..',
        '.T......T....T..',
        '.T......T....T..',
        '.x......x....x..',
        '.W......W....W..',
        '................',
        '.W.W..W.W..W.W..',
        '................',
        '................'
      ]
    },
    art_holy: {
      pal: { W: '#ffffff', Y: '#fff2b0', y: '#e8c25a', o: '#a8842e' },
      rows: [
        '.......Y........',
        '...Y...Y...Y....',
        '....Y..W..Y.....',
        '.....YWWWY......',
        '......WWW.......',
        '.YYYWWWWWWWYYY..',
        '......WWW.......',
        '.....YWWWY......',
        '....Y..W..Y.....',
        '...Y...W...Y....',
        '.......W........',
        '.......Y........',
        '.......Y........',
        '.......y........',
        '................',
        '................'
      ]
    },
    art_shield: {
      pal: { W: '#ffffff', L: '#c8dcff', B: '#5a86d8', b: '#3a5aa8', d: '#22366e', Y: '#e8c25a' },
      rows: [
        '................',
        '..YYYYYYYYYYYY..',
        '..YLLLLLBBBBBY..',
        '..YLWLLLBBBBBY..',
        '..YLLLLLBBBBBY..',
        '..YLLLLLBBBBBY..',
        '..YBBBBBbbbbbY..',
        '..YBBBBBbbbbbY..',
        '..YBBBBBbbbbbY..',
        '...YBBBBbbbbY...',
        '...YBBBBbbbbY...',
        '....YBBBbbbY....',
        '.....YBBbbY.....',
        '......YbbY......',
        '.......YY.......',
        '................'
      ]
    },
    art_ward: {
      pal: { W: '#ffffff', L: '#ece0ff', P: '#c8a8ff', p: '#8a62e0', d: '#5a3aa8' },
      rows: [
        '................',
        '......pppp......',
        '....ppPPPPpp....',
        '...pPP....PPp...',
        '..pP...LL...Pp..',
        '..pP..LWWL..Pp..',
        '.pP..LW..WL..Pp.',
        '.pP..L....L..Pp.',
        '.pP..LW..WL..Pp.',
        '..pP..LWWL..Pp..',
        '..pP...LL...Pp..',
        '...pPP....PPp...',
        '....ppPPPPpp....',
        '......pppp......',
        '................',
        '................'
      ]
    },
    art_heal: {
      pal: { W: '#ffffff', G: '#8ff0a0', g: '#3ac86a', d: '#1e8a44' },
      rows: [
        '................',
        '......dddd...W..',
        '......dGGd..WWW.',
        '......dGGd...W..',
        '......dGGd......',
        '..ddddgGGgdddd..',
        '..dGGGGWWGGGGd..',
        '..dGGGGWWGGGGd..',
        '..ddddgGGgdddd..',
        '......dGGd......',
        '......dGGd......',
        '..W...dGGd......',
        '.WWW..dddd......',
        '..W.............',
        '................',
        '................'
      ]
    },
    art_cards: {
      pal: { W: '#f4ecd8', w: '#d8c8a4', B: '#3a4e98', b: '#26366e', Y: '#e8c25a' },
      rows: [
        '................',
        '.....BBBBBB.....',
        '....BbbbbbbB....',
        '....BbYbbYbB....',
        '..WWWWWWbbbB....',
        '..WwwwwWbYbB....',
        '..WwYYwWbbbB....',
        '..WwYYwWbbYB....',
        '..WwwwwWbbbB....',
        '..WwYYwWBBBB....',
        '..WwYYwW........',
        '..WwwwwW........',
        '..WWWWWW........',
        '................',
        '................',
        '................'
      ]
    },
    art_eye: {
      pal: { W: '#ffffff', C: '#8ab0ff', c: '#3a5ad8', k: '#141a3a', d: '#8a6ad8', D: '#5a3aa8' },
      rows: [
        '................',
        '................',
        '.....DDDDDD.....',
        '...DDddddddDD...',
        '..Dd..WWWW..dD..',
        '.Dd.WWcccCWW.dD.',
        'Dd.WWccCWccWW.dD',
        'D..WcckkCccWW..D',
        'Dd.WWcckkccWW.dD',
        '.Dd.WWccccWW.dD.',
        '..Dd..WWWW..dD..',
        '...DDddddddDD...',
        '.....DDDDDD.....',
        '................',
        '................',
        '................'
      ]
    },
    art_gem: {
      pal: { W: '#ffffff', Y: '#fff27a', y: '#e8c25a', o: '#a8781a' },
      rows: [
        '................',
        '.....oooooo.....',
        '....oyYYYYyo....',
        '...oyYWWYYYyo...',
        '..oyYWYYYYYYyo..',
        '..oooooooooooo..',
        '...oyYYYYYYyo...',
        '....oyYYYYyo....',
        '.....oyYYyo.....',
        '......oyyo......',
        '.......oo.......',
        '................',
        '................',
        '................',
        '................',
        '................'
      ]
    },
    art_up: {
      pal: { R: '#ff8a6a', r: '#d84a3a', Y: '#ffe08a', y: '#e8b82a' },
      rows: [
        '................',
        '.......Y........',
        '......YYY.......',
        '.....YYYYY......',
        '....YYYYYYY.....',
        '.......Y........',
        '...r...Y...r....',
        '..rrr..Y..rrr...',
        '.rrrrr.y.rrrrr..',
        '...r.......r....',
        '...r.......r....',
        '...r..Y....r....',
        '.....YYY........',
        '....YYYYY.......',
        '......Y.........',
        '................'
      ]
    },
    art_purge: {
      pal: { W: '#ffffff', P: '#e0b0ff', p: '#a060e0', d: '#6a2ab0', D: '#3a1468' },
      rows: [
        '.......p........',
        '......pp........',
        '......ppp...p...',
        '.....ppPpp..pp..',
        '.....pPPp..ppp..',
        '....ppPPPpppPp..',
        '...ppPPWPPppPPp.',
        '...pPPWWWPPPPp..',
        '..ppPPWWWWPPPpp.',
        '..pPPWWWWWWPPPp.',
        '..pPPWWWWWWWPPp.',
        '..dpPPWWWWWPPpd.',
        '...dpPPPPPPPpd..',
        '....ddppppppd...',
        '.....DDDDDDD....',
        '................'
      ]
    },
    art_wind: {
      pal: { W: '#ffffff', w: '#c8f0e8', g: '#6ac8a8' },
      rows: [
        '................',
        '................',
        '...wwwwwwww.....',
        '.wW........w....',
        '...........w....',
        '.....wwwwww.....',
        '................',
        '..wwwwwwwwwwww..',
        'wW............w.',
        '..............w.',
        '......wwwwwwww..',
        '................',
        '...wwwwww.......',
        '.wW......w......',
        '.........w......',
        '................'
      ]
    },
    art_aura: {
      pal: { W: '#ffffff', Y: '#ffe88a', y: '#e8c25a', o: '#a8842e' },
      rows: [
        '.......Y........',
        '...Y...y...Y....',
        '....y.....y.....',
        '.....oyyyo......',
        '....oyYYYyo.....',
        '..Yyy.YWY.yyY...',
        '....oyYYYyo.....',
        '.....oyyyo......',
        '....y.....y.....',
        '...Y...y...Y....',
        '.......Y........',
        '................',
        '..Y..........Y..',
        '.YWY........YWY.',
        '..Y..........Y..',
        '................'
      ]
    }
  };
})(globalThis.RASEN = globalThis.RASEN || {});
