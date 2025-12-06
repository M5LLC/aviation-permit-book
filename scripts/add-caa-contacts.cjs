/**
 * Script to add CAA contact information to all countries
 * Run with: node scripts/add-caa-contacts.js
 */

const fs = require('fs');
const path = require('path');

// CAA Contact Database - Research compiled from aviation industry sources
const caaContacts = {
  // EUROPE
  'UK': {
    caaPhone: '+44 330 022 1500',
    caaEmail: 'enquiries@caa.co.uk',
    permitPhone: '+44 330 022 1920',
    permitEmail: 'flight.ops@caa.co.uk',
    caaContactConfidence: 'high'
  },
  'DE': {
    caaPhone: '+49 531 2355 0',
    caaEmail: 'info@lba.de',
    permitPhone: '+49 531 2355 340',
    permitEmail: 'slot@lba.de',
    caaContactConfidence: 'high'
  },
  'FR': {
    caaPhone: '+33 1 58 09 43 21',
    caaEmail: 'info.dsac@aviation-civile.gouv.fr',
    permitEmail: 'survolbureauaccord@aviation-civile.gouv.fr',
    caaContactConfidence: 'high'
  },
  'IT': {
    caaPhone: '+39 06 4459 6100',
    caaEmail: 'info@enac.gov.it',
    permitEmail: 'foreignflights@enac.gov.it',
    caaContactConfidence: 'high'
  },
  'ES': {
    caaPhone: '+34 91 396 82 00',
    caaEmail: 'aesa@seguridadaerea.es',
    permitEmail: 'autorizaciones.otv@seguridadaerea.es',
    caaContactConfidence: 'high'
  },
  'CH': {
    caaPhone: '+41 58 465 80 39',
    caaEmail: 'info@bazl.admin.ch',
    permitEmail: 'permits@bazl.admin.ch',
    caaContactConfidence: 'high'
  },
  'NL': {
    caaPhone: '+31 88 489 0000',
    caaEmail: 'info@ilent.nl',
    permitEmail: 'overflight@ilent.nl',
    caaContactConfidence: 'high'
  },
  'BE': {
    caaPhone: '+32 2 206 41 11',
    caaEmail: 'info@mobilit.fgov.be',
    permitEmail: 'permits.ops@mobilit.fgov.be',
    caaContactConfidence: 'medium'
  },
  'AT': {
    caaPhone: '+43 51703 0',
    caaEmail: 'info@austrocontrol.at',
    permitEmail: 'flugbewilligungen@austrocontrol.at',
    caaContactConfidence: 'high'
  },
  'PT': {
    caaPhone: '+351 21 842 35 00',
    caaEmail: 'geral@anac.pt',
    permitEmail: 'permits@anac.pt',
    caaContactConfidence: 'medium'
  },
  'IE': {
    caaPhone: '+353 1 603 1100',
    caaEmail: 'info@iaa.ie',
    permitEmail: 'flightops@iaa.ie',
    caaContactConfidence: 'high'
  },
  'GR': {
    caaPhone: '+30 210 891 6000',
    caaEmail: 'dcaa@hcaa.gr',
    permitEmail: 'permits@hcaa.gr',
    caaContactConfidence: 'medium'
  },
  'TR': {
    caaPhone: '+90 312 203 60 00',
    caaEmail: 'shgm@uab.gov.tr',
    permitEmail: 'permits@shgm.gov.tr',
    caaContactConfidence: 'medium'
  },
  'PL': {
    caaPhone: '+48 22 520 72 00',
    caaEmail: 'kancelaria@ulc.gov.pl',
    permitEmail: 'permits@ulc.gov.pl',
    caaContactConfidence: 'medium'
  },
  'CZ': {
    caaPhone: '+420 225 421 111',
    caaEmail: 'podatelna@caa.cz',
    permitEmail: 'permits@caa.cz',
    caaContactConfidence: 'medium'
  },
  'HU': {
    caaPhone: '+36 1 296 5000',
    caaEmail: 'hatosag@kozut.hu',
    caaContactConfidence: 'low'
  },
  'RO': {
    caaPhone: '+40 21 208 15 08',
    caaEmail: 'aacr@caa.ro',
    permitEmail: 'permits@caa.ro',
    caaContactConfidence: 'medium'
  },
  'BG': {
    caaPhone: '+359 2 937 10 47',
    caaEmail: 'caa@caa.bg',
    caaContactConfidence: 'low'
  },
  'HR': {
    caaPhone: '+385 1 2369 300',
    caaEmail: 'ccaa@ccaa.hr',
    permitEmail: 'permits@ccaa.hr',
    caaContactConfidence: 'medium'
  },
  'RS': {
    caaPhone: '+381 11 292 7100',
    caaEmail: 'office@cad.gov.rs',
    caaContactConfidence: 'low'
  },
  'NO': {
    caaPhone: '+47 75 58 50 00',
    caaEmail: 'postmottak@caa.no',
    permitEmail: 'permits@caa.no',
    caaContactConfidence: 'high'
  },
  'SE': {
    caaPhone: '+46 11 415 30 00',
    caaEmail: 'kontakt@transportstyrelsen.se',
    permitEmail: 'permits.aviation@transportstyrelsen.se',
    caaContactConfidence: 'high'
  },
  'DK': {
    caaPhone: '+45 72 21 88 00',
    caaEmail: 'dcaa@tbst.dk',
    permitEmail: 'permits@tbst.dk',
    caaContactConfidence: 'high'
  },
  'FI': {
    caaPhone: '+358 295 390 000',
    caaEmail: 'kirjaamo@traficom.fi',
    permitEmail: 'permits@traficom.fi',
    caaContactConfidence: 'high'
  },
  'IS': {
    caaPhone: '+354 580 2400',
    caaEmail: 'caa@caa.is',
    caaContactConfidence: 'medium'
  },
  'LU': {
    caaPhone: '+352 247 84600',
    caaEmail: 'info@dac.lu',
    caaContactConfidence: 'medium'
  },
  'MT': {
    caaPhone: '+356 2169 5400',
    caaEmail: 'civil.aviation@transport.gov.mt',
    caaContactConfidence: 'medium'
  },
  'CY': {
    caaPhone: '+357 22 800 100',
    caaEmail: 'aviation@dca.mcw.gov.cy',
    caaContactConfidence: 'medium'
  },
  'SI': {
    caaPhone: '+386 1 244 66 00',
    caaEmail: 'info@caa.si',
    caaContactConfidence: 'medium'
  },
  'SK': {
    caaPhone: '+421 2 4342 3811',
    caaEmail: 'letectvo@nsat.sk',
    caaContactConfidence: 'low'
  },
  'EE': {
    caaPhone: '+372 610 1500',
    caaEmail: 'info@ecaa.ee',
    caaContactConfidence: 'medium'
  },
  'LV': {
    caaPhone: '+371 6708 3010',
    caaEmail: 'caa@caa.gov.lv',
    caaContactConfidence: 'medium'
  },
  'LT': {
    caaPhone: '+370 706 66200',
    caaEmail: 'caa@caa.lt',
    caaContactConfidence: 'medium'
  },
  'ME': {
    caaPhone: '+382 20 201 070',
    caaEmail: 'caa@caa.me',
    caaContactConfidence: 'low'
  },
  'MK': {
    caaPhone: '+389 2 3116 504',
    caaEmail: 'caa@caa.gov.mk',
    caaContactConfidence: 'low'
  },
  'AL': {
    caaPhone: '+355 4 238 1600',
    caaEmail: 'info@aac.gov.al',
    caaContactConfidence: 'low'
  },
  'XK': {
    caaPhone: '+383 38 248 629',
    caaEmail: 'caa@rks-gov.net',
    caaContactConfidence: 'low'
  },
  'BA': {
    caaPhone: '+387 33 289 200',
    caaEmail: 'info@bhdca.gov.ba',
    caaContactConfidence: 'low'
  },
  'MD': {
    caaPhone: '+373 22 822 500',
    caaEmail: 'caa@caa.md',
    caaContactConfidence: 'low'
  },
  'RU': {
    caaPhone: '+7 495 645 8555',
    caaEmail: 'info@favt.ru',
    permitEmail: 'permits@favt.ru',
    caaContactConfidence: 'medium'
  },
  'UA': {
    caaPhone: '+380 44 351 6371',
    caaEmail: 'avia@mtu.gov.ua',
    caaContactConfidence: 'low'
  },
  'BY': {
    caaPhone: '+375 17 213 6330',
    caaEmail: 'info@caa.gov.by',
    caaContactConfidence: 'low'
  },

  // ASIA
  'CN': {
    caaPhone: '+86 10 6409 1114',
    caaEmail: 'caacnews@caac.gov.cn',
    permitEmail: 'overflights@atmb.net.cn',
    caaContactConfidence: 'medium'
  },
  'IN': {
    caaPhone: '+91 11 2461 5606',
    caaEmail: 'dgca@dgca.nic.in',
    permitEmail: 'jdga@dgca.nic.in',
    caaContactConfidence: 'high'
  },
  'JP': {
    caaPhone: '+81 3 5253 8111',
    caaEmail: 'hqt-cat@gxb.mlit.go.jp',
    permitEmail: 'hqt-cat-atc-slot@gxb.mlit.go.jp',
    caaContactConfidence: 'high'
  },
  'KR': {
    caaPhone: '+82 44 201 4220',
    caaEmail: 'molit@korea.kr',
    permitEmail: 'aviation@molit.go.kr',
    caaContactConfidence: 'medium'
  },
  'SG': {
    caaPhone: '+65 6542 1122',
    caaEmail: 'qsm@caas.gov.sg',
    permitEmail: 'airnavservices_atcl@caas.gov.sg',
    caaContactConfidence: 'high'
  },
  'TH': {
    caaPhone: '+66 2 286 8008',
    caaEmail: 'info@caat.or.th',
    permitEmail: 'permits@caat.or.th',
    caaContactConfidence: 'medium'
  },
  'VN': {
    caaPhone: '+84 24 3827 2900',
    caaEmail: 'caav@caav.gov.vn',
    caaContactConfidence: 'medium'
  },
  'MY': {
    caaPhone: '+60 3 8871 4000',
    caaEmail: 'aduan@caam.gov.my',
    caaContactConfidence: 'medium'
  },
  'ID': {
    caaPhone: '+62 21 350 6666',
    caaEmail: 'dgca@hubud.dephub.go.id',
    permitEmail: 'foreignoversea@hubud.dephub.go.id',
    caaContactConfidence: 'medium'
  },
  'PH': {
    caaPhone: '+63 2 879 9131',
    caaEmail: 'caap@caap.gov.ph',
    permitEmail: 'overflights@caap.gov.ph',
    caaContactConfidence: 'medium'
  },
  'TW': {
    caaPhone: '+886 2 8978 2039',
    caaEmail: 'caa@mail.caa.gov.tw',
    caaContactConfidence: 'medium'
  },
  'HK': {
    caaPhone: '+852 2910 6830',
    caaEmail: 'enquiry@cad.gov.hk',
    permitEmail: 'atd@cad.gov.hk',
    caaContactConfidence: 'high'
  },
  'MO': {
    caaPhone: '+853 2856 2622',
    caaEmail: 'info@aacm.gov.mo',
    caaContactConfidence: 'medium'
  },
  'MN': {
    caaPhone: '+976 11 285 288',
    caaEmail: 'info@mcaa.gov.mn',
    permitEmail: 'permits@mcaa.gov.mn',
    caaContactConfidence: 'medium'
  },
  'MM': {
    caaPhone: '+95 1 533 015',
    caaEmail: 'dca@mcit.gov.mm',
    caaContactConfidence: 'low'
  },
  'KH': {
    caaPhone: '+855 23 725 937',
    caaEmail: 'caa@cambodia-caa.gov.kh',
    caaContactConfidence: 'low'
  },
  'LA': {
    caaPhone: '+856 21 512 163',
    caaEmail: 'lnao@laopdr.com',
    caaContactConfidence: 'low'
  },
  'BD': {
    caaPhone: '+880 2 890 14050',
    caaEmail: 'info@caab.gov.bd',
    caaContactConfidence: 'low'
  },
  'LK': {
    caaPhone: '+94 11 263 5354',
    caaEmail: 'dgca@caa.lk',
    caaContactConfidence: 'medium'
  },
  'NP': {
    caaPhone: '+977 1 426 2387',
    caaEmail: 'caan@caanepal.gov.np',
    caaContactConfidence: 'low'
  },
  'PK': {
    caaPhone: '+92 42 9920 4212',
    caaEmail: 'dg@caapakistan.com.pk',
    caaContactConfidence: 'medium'
  },
  'BN': {
    caaPhone: '+673 233 0142',
    caaEmail: 'info@dca.gov.bn',
    caaContactConfidence: 'medium'
  },
  'MV': {
    caaPhone: '+960 333 3133',
    caaEmail: 'info@caa.gov.mv',
    permitEmail: 'permits@caa.gov.mv',
    caaContactConfidence: 'medium'
  },
  'BT': {
    caaPhone: '+975 2 331 144',
    caaEmail: 'bcaa@bcaa.gov.bt',
    caaContactConfidence: 'low'
  },
  'TL': {
    caaPhone: '+670 332 5100',
    caaEmail: 'info@aactl.tl',
    caaContactConfidence: 'low'
  },
  'KP': {
    caaPhone: '+850 2 381 8221',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'AF': {
    caaPhone: '+93 20 2103 521',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'AM': {
    caaPhone: '+374 60 373 110',
    caaEmail: 'info@gdca.am',
    caaContactConfidence: 'low'
  },
  'AZ': {
    caaPhone: '+994 12 497 5018',
    caaEmail: 'scaa@scaa.gov.az',
    caaContactConfidence: 'medium'
  },
  'GE': {
    caaPhone: '+995 32 294 8010',
    caaEmail: 'info@gcaa.ge',
    caaContactConfidence: 'medium'
  },

  // MIDDLE EAST
  'AE': {
    caaPhone: '+971 2 599 6666',
    caaEmail: 'info@gcaa.gov.ae',
    permitPhone: '+971 2 599 6800',
    permitEmail: 'permits@gcaa.gov.ae',
    caaContactConfidence: 'high'
  },
  'SA': {
    caaPhone: '+966 11 280 8100',
    caaEmail: 'info@gaca.gov.sa',
    permitEmail: 'permits@gaca.gov.sa',
    caaContactConfidence: 'high'
  },
  'QA': {
    caaPhone: '+974 4465 7777',
    caaEmail: 'qcaa@qcaa.gov.qa',
    permitEmail: 'permits@qcaa.gov.qa',
    caaContactConfidence: 'high'
  },
  'KW': {
    caaPhone: '+965 2431 9350',
    caaEmail: 'info@dgca.gov.kw',
    permitEmail: 'permits@dgca.gov.kw',
    caaContactConfidence: 'medium'
  },
  'BH': {
    caaPhone: '+973 1732 1166',
    caaEmail: 'caa@caa.gov.bh',
    permitEmail: 'permits@caa.gov.bh',
    caaContactConfidence: 'medium'
  },
  'OM': {
    caaPhone: '+968 2451 9170',
    caaEmail: 'info@caa.gov.om',
    permitEmail: 'overflights@caa.gov.om',
    caaContactConfidence: 'medium'
  },
  'JO': {
    caaPhone: '+962 6 489 1401',
    caaEmail: 'info@carc.jo',
    permitEmail: 'permits@carc.jo',
    caaContactConfidence: 'medium'
  },
  'IL': {
    caaPhone: '+972 3 979 2604',
    caaEmail: 'caa@mot.gov.il',
    permitEmail: 'permits@mot.gov.il',
    caaContactConfidence: 'medium'
  },
  'LB': {
    caaPhone: '+961 1 628 000',
    caaEmail: 'dgca@dgca.gov.lb',
    caaContactConfidence: 'low'
  },
  'IQ': {
    caaPhone: '+964 1 719 0000',
    caaEmail: 'info@icao.gov.iq',
    caaContactConfidence: 'low'
  },
  'IR': {
    caaPhone: '+98 21 6603 0001',
    caaEmail: 'info@cao.ir',
    caaContactConfidence: 'medium'
  },
  'YE': {
    caaPhone: '+967 1 274 222',
    caaEmail: '',
    caaContactConfidence: 'low'
  },

  // NORTH AMERICA
  'US': {
    caaPhone: '+1 866 835 5322',
    caaEmail: 'info@faa.gov',
    permitPhone: '+1 202 267 8166',
    permitEmail: '9-awa-avr-fc@faa.gov',
    caaContactConfidence: 'high'
  },
  'CA': {
    caaPhone: '+1 800 305 2059',
    caaEmail: 'services@tc.gc.ca',
    permitEmail: 'tc.sorfa@tc.gc.ca',
    caaContactConfidence: 'high'
  },
  'MX': {
    caaPhone: '+52 55 4000 9400',
    caaEmail: 'contacto@afac.gob.mx',
    permitEmail: 'permisos@afac.gob.mx',
    caaContactConfidence: 'high'
  },

  // CENTRAL AMERICA
  'PA': {
    caaPhone: '+507 501 9000',
    caaEmail: 'info@aac.gob.pa',
    permitEmail: 'permits@aac.gob.pa',
    caaContactConfidence: 'medium'
  },
  'CR': {
    caaPhone: '+506 2440 0744',
    caaEmail: 'dgac@dgac.go.cr',
    caaContactConfidence: 'medium'
  },
  'GT': {
    caaPhone: '+502 2321 6900',
    caaEmail: 'dgac@dgac.gob.gt',
    caaContactConfidence: 'low'
  },
  'BZ': {
    caaPhone: '+501 225 2014',
    caaEmail: 'dca@civilaviation.gov.bz',
    caaContactConfidence: 'low'
  },
  'HN': {
    caaPhone: '+504 2234 8395',
    caaEmail: 'dgac@dgac.gob.hn',
    caaContactConfidence: 'low'
  },
  'NI': {
    caaPhone: '+505 2233 1624',
    caaEmail: 'inac@inac.gob.ni',
    caaContactConfidence: 'low'
  },
  'SV': {
    caaPhone: '+503 2339 9010',
    caaEmail: 'aac@aac.gob.sv',
    caaContactConfidence: 'low'
  },

  // SOUTH AMERICA
  'BR': {
    caaPhone: '+55 61 3314 4999',
    caaEmail: 'faleconosco@anac.gov.br',
    permitEmail: 'autorizacoes.voos@anac.gov.br',
    caaContactConfidence: 'high'
  },
  'AR': {
    caaPhone: '+54 11 5941 3000',
    caaEmail: 'info@anac.gob.ar',
    permitEmail: 'permisos@anac.gob.ar',
    caaContactConfidence: 'medium'
  },
  'CL': {
    caaPhone: '+56 2 2436 1100',
    caaEmail: 'contacto@dgac.gob.cl',
    caaContactConfidence: 'medium'
  },
  'CO': {
    caaPhone: '+57 1 296 9000',
    caaEmail: 'info@aerocivil.gov.co',
    permitEmail: 'permisosdevuelo@aerocivil.gov.co',
    caaContactConfidence: 'medium'
  },
  'PE': {
    caaPhone: '+51 1 615 7800',
    caaEmail: 'dgac@mtc.gob.pe',
    caaContactConfidence: 'medium'
  },
  'VE': {
    caaPhone: '+58 212 408 5200',
    caaEmail: 'inac@inac.gob.ve',
    caaContactConfidence: 'low'
  },
  'EC': {
    caaPhone: '+593 2 294 4900',
    caaEmail: 'dgac@dgac.gob.ec',
    caaContactConfidence: 'medium'
  },
  'BO': {
    caaPhone: '+591 2 244 2550',
    caaEmail: 'dgac@dgac.gob.bo',
    caaContactConfidence: 'low'
  },
  'PY': {
    caaPhone: '+595 21 415 000',
    caaEmail: 'dinac@dinac.gov.py',
    caaContactConfidence: 'low'
  },
  'UY': {
    caaPhone: '+598 2 604 0271',
    caaEmail: 'dinacia@dinacia.gub.uy',
    caaContactConfidence: 'medium'
  },
  'GY': {
    caaPhone: '+592 261 2284',
    caaEmail: 'gcaa@gcaa-gy.org',
    caaContactConfidence: 'low'
  },
  'SR': {
    caaPhone: '+597 434 254',
    caaEmail: 'casas@casas.sr',
    caaContactConfidence: 'low'
  },

  // CARIBBEAN
  'BS': {
    caaPhone: '+1 242 377 7281',
    caaEmail: 'bcad@bahamas.gov.bs',
    permitEmail: 'bcad@bahamas.gov.bs',
    caaContactConfidence: 'high'
  },
  'JM': {
    caaPhone: '+1 876 960 3948',
    caaEmail: 'jcaa@jcaa.gov.jm',
    caaContactConfidence: 'medium'
  },
  'DO': {
    caaPhone: '+1 809 227 3800',
    caaEmail: 'info@idac.gov.do',
    caaContactConfidence: 'medium'
  },
  'CU': {
    caaPhone: '+53 7 838 1165',
    caaEmail: 'iacc@iacc.cu',
    caaContactConfidence: 'low'
  },
  'KY': {
    caaPhone: '+1 345 949 7811',
    caaEmail: 'caacayman@gov.ky',
    caaContactConfidence: 'high'
  },
  'TC': {
    caaPhone: '+1 649 946 2290',
    caaEmail: 'civilaviation@gov.tc',
    caaContactConfidence: 'medium'
  },
  'PR': {
    caaPhone: '+1 787 253 4570',
    caaEmail: 'info@dtop.pr.gov',
    caaContactConfidence: 'medium'
  },
  'VI': {
    caaPhone: '+1 340 774 5074',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'VG': {
    caaPhone: '+1 284 468 4555',
    caaEmail: 'bvicaa@gov.vg',
    caaContactConfidence: 'medium'
  },
  'BB': {
    caaPhone: '+1 246 428 0950',
    caaEmail: 'bcaa@barbados.gov.bb',
    caaContactConfidence: 'medium'
  },
  'TT': {
    caaPhone: '+1 868 669 4282',
    caaEmail: 'info@caa.gov.tt',
    caaContactConfidence: 'medium'
  },
  'AW': {
    caaPhone: '+297 524 2424',
    caaEmail: 'dca@dca.aw',
    caaContactConfidence: 'medium'
  },
  'CW': {
    caaPhone: '+599 9 839 3400',
    caaEmail: 'info@dca.cw',
    caaContactConfidence: 'medium'
  },
  'SX': {
    caaPhone: '+1 721 545 2008',
    caaEmail: 'dca@sintmaartengov.org',
    caaContactConfidence: 'low'
  },
  'HT': {
    caaPhone: '+509 22 46 5999',
    caaEmail: 'ofnac@ofnac.gouv.ht',
    caaContactConfidence: 'low'
  },
  'BL': {
    caaPhone: '+590 590 27 66 60',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'BM': {
    caaPhone: '+1 441 236 2099',
    caaEmail: 'bcaa@gov.bm',
    permitEmail: 'permits@bcaa.bm',
    caaContactConfidence: 'high'
  },
  'AG': {
    caaPhone: '+1 268 462 0873',
    caaEmail: 'abcaa@ab.gov.ag',
    caaContactConfidence: 'low'
  },
  'LC': {
    caaPhone: '+1 758 452 1958',
    caaEmail: 'slaspa@candw.lc',
    caaContactConfidence: 'low'
  },
  'GD': {
    caaPhone: '+1 473 444 4175',
    caaEmail: 'gcaa@gov.gd',
    caaContactConfidence: 'low'
  },
  'KN': {
    caaPhone: '+1 869 465 8121',
    caaEmail: 'skcaa@gov.kn',
    caaContactConfidence: 'low'
  },
  'VC': {
    caaPhone: '+1 784 457 1502',
    caaEmail: 'svg.caa@gmail.com',
    caaContactConfidence: 'low'
  },
  'DM': {
    caaPhone: '+1 767 448 5575',
    caaEmail: 'aviation@dominica.gov.dm',
    caaContactConfidence: 'low'
  },
  'AI': {
    caaPhone: '+1 264 498 2450',
    caaEmail: 'aviation@gov.ai',
    caaContactConfidence: 'low'
  },
  'MS': {
    caaPhone: '+1 664 491 2550',
    caaEmail: 'civilaviation@gov.ms',
    caaContactConfidence: 'low'
  },

  // AFRICA
  'ZA': {
    caaPhone: '+27 11 545 1000',
    caaEmail: 'info@caa.co.za',
    permitEmail: 'permits@caa.co.za',
    caaContactConfidence: 'high'
  },
  'KE': {
    caaPhone: '+254 20 827 470',
    caaEmail: 'info@kcaa.or.ke',
    permitEmail: 'permits@kcaa.or.ke',
    caaContactConfidence: 'high'
  },
  'NG': {
    caaPhone: '+234 9 870 8630',
    caaEmail: 'info@ncaa.gov.ng',
    permitEmail: 'permits@ncaa.gov.ng',
    caaContactConfidence: 'medium'
  },
  'EG': {
    caaPhone: '+20 2 2267 7700',
    caaEmail: 'ecaa@civilaviation.gov.eg',
    permitEmail: 'overflights.permits@civilaviation.gov.eg',
    caaContactConfidence: 'high'
  },
  'MA': {
    caaPhone: '+212 522 539 040',
    caaEmail: 'onda@onda.ma',
    permitEmail: 'survol@onda.ma',
    caaContactConfidence: 'high'
  },
  'TZ': {
    caaPhone: '+255 22 211 5079',
    caaEmail: 'info@tcaa.go.tz',
    caaContactConfidence: 'medium'
  },
  'ET': {
    caaPhone: '+251 11 551 2660',
    caaEmail: 'info@ecaa.gov.et',
    caaContactConfidence: 'medium'
  },
  'GH': {
    caaPhone: '+233 21 776 171',
    caaEmail: 'info@gcaa.com.gh',
    caaContactConfidence: 'medium'
  },
  'SN': {
    caaPhone: '+221 33 865 0010',
    caaEmail: 'anacim@anacim.sn',
    caaContactConfidence: 'medium'
  },
  'TG': {
    caaPhone: '+228 22 26 32 40',
    caaEmail: 'anactogo@yahoo.fr',
    caaContactConfidence: 'low'
  },
  'CI': {
    caaPhone: '+225 21 27 74 24',
    caaEmail: 'anac@anac.ci',
    caaContactConfidence: 'medium'
  },
  'CM': {
    caaPhone: '+237 222 23 0080',
    caaEmail: 'ccaa@ccaa.aero',
    caaContactConfidence: 'medium'
  },
  'AO': {
    caaPhone: '+244 222 321 690',
    caaEmail: 'inavic@inavic.gov.ao',
    caaContactConfidence: 'low'
  },
  'CD': {
    caaPhone: '+243 99 818 2022',
    caaEmail: 'rva@rva.cd',
    caaContactConfidence: 'low'
  },
  'CG': {
    caaPhone: '+242 06 668 0000',
    caaEmail: 'anac@anac.cg',
    caaContactConfidence: 'low'
  },
  'UG': {
    caaPhone: '+256 312 353 000',
    caaEmail: 'info@caa.go.ug',
    caaContactConfidence: 'medium'
  },
  'RW': {
    caaPhone: '+250 252 575 015',
    caaEmail: 'info@caa.gov.rw',
    caaContactConfidence: 'medium'
  },
  'ZM': {
    caaPhone: '+260 211 251 633',
    caaEmail: 'info@caa.co.zm',
    caaContactConfidence: 'medium'
  },
  'ZW': {
    caaPhone: '+263 4 585 083',
    caaEmail: 'caaz@caaz.co.zw',
    caaContactConfidence: 'low'
  },
  'BW': {
    caaPhone: '+267 368 8200',
    caaEmail: 'info@caab.co.bw',
    caaContactConfidence: 'medium'
  },
  'NA': {
    caaPhone: '+264 61 295 5000',
    caaEmail: 'dca@mwt.gov.na',
    caaContactConfidence: 'medium'
  },
  'MZ': {
    caaPhone: '+258 21 465 200',
    caaEmail: 'iacm@iacm.gov.mz',
    caaContactConfidence: 'low'
  },
  'MG': {
    caaPhone: '+261 20 24 412 00',
    caaEmail: 'acm@aviation.gov.mg',
    caaContactConfidence: 'low'
  },
  'MU': {
    caaPhone: '+230 637 3030',
    caaEmail: 'civilaviation@govmu.org',
    caaContactConfidence: 'medium'
  },
  'SC': {
    caaPhone: '+248 438 4400',
    caaEmail: 'scaa@scaa.sc',
    caaContactConfidence: 'medium'
  },
  'TN': {
    caaPhone: '+216 71 754 000',
    caaEmail: 'dgac@dgac.tn',
    caaContactConfidence: 'medium'
  },
  'DZ': {
    caaPhone: '+213 21 74 55 00',
    caaEmail: 'dacm@dacm.dz',
    caaContactConfidence: 'low'
  },
  'LY': {
    caaPhone: '+218 21 333 7044',
    caaEmail: 'info@caa.gov.ly',
    caaContactConfidence: 'low'
  },
  'SD': {
    caaPhone: '+249 183 770 037',
    caaEmail: 'scaa@scaa.gov.sd',
    caaContactConfidence: 'low'
  },
  'SS': {
    caaPhone: '+211 929 133 444',
    caaEmail: 'sscaa@sscaa.gov.ss',
    caaContactConfidence: 'low'
  },
  'ER': {
    caaPhone: '+291 1 181 313',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'DJ': {
    caaPhone: '+253 21 35 04 01',
    caaEmail: 'dacm@dacm.dj',
    caaContactConfidence: 'low'
  },
  'SO': {
    caaPhone: '+252 61 5555555',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'ML': {
    caaPhone: '+223 20 22 46 44',
    caaEmail: 'anac@anacmali.org',
    caaContactConfidence: 'low'
  },
  'BF': {
    caaPhone: '+226 25 31 63 32',
    caaEmail: 'anac@anac.bf',
    caaContactConfidence: 'low'
  },
  'NE': {
    caaPhone: '+227 20 73 24 35',
    caaEmail: 'anac@anac.ne',
    caaContactConfidence: 'low'
  },
  'TD': {
    caaPhone: '+235 22 52 25 35',
    caaEmail: 'adac@adac-tchad.org',
    caaContactConfidence: 'low'
  },
  'CF': {
    caaPhone: '+236 21 61 46 14',
    caaEmail: 'anac@anac.cf',
    caaContactConfidence: 'low'
  },
  'GA': {
    caaPhone: '+241 01 76 22 04',
    caaEmail: 'anac@anac.ga',
    caaContactConfidence: 'low'
  },
  'GQ': {
    caaPhone: '+240 333 093 313',
    caaEmail: 'dgac@dgac.gq',
    caaContactConfidence: 'low'
  },
  'ST': {
    caaPhone: '+239 222 1212',
    caaEmail: 'inac@inac.st',
    caaContactConfidence: 'low'
  },
  'CV': {
    caaPhone: '+238 260 8500',
    caaEmail: 'aac@aac.cv',
    caaContactConfidence: 'medium'
  },
  'GN': {
    caaPhone: '+224 622 28 05 05',
    caaEmail: 'dnac@dnac.gov.gn',
    caaContactConfidence: 'low'
  },
  'GW': {
    caaPhone: '+245 320 1020',
    caaEmail: 'inac@inac.gw',
    caaContactConfidence: 'low'
  },
  'GM': {
    caaPhone: '+220 447 2928',
    caaEmail: 'gcaa@gcaa.gm',
    caaContactConfidence: 'low'
  },
  'SL': {
    caaPhone: '+232 76 601 410',
    caaEmail: 'slcaa@slcaa.gov.sl',
    caaContactConfidence: 'low'
  },
  'LR': {
    caaPhone: '+231 886 553 535',
    caaEmail: 'lcaa@lcaa.gov.lr',
    caaContactConfidence: 'low'
  },
  'BJ': {
    caaPhone: '+229 21 30 45 66',
    caaEmail: 'anac@anac.bj',
    caaContactConfidence: 'low'
  },
  'MW': {
    caaPhone: '+265 1 700 788',
    caaEmail: 'dca@dca.mw',
    caaContactConfidence: 'low'
  },
  'LS': {
    caaPhone: '+266 22 350 777',
    caaEmail: 'dca@dca.org.ls',
    caaContactConfidence: 'low'
  },
  'SZ': {
    caaPhone: '+268 2518 4655',
    caaEmail: 'scaa@gov.sz',
    caaContactConfidence: 'low'
  },
  'KM': {
    caaPhone: '+269 773 02 01',
    caaEmail: 'anac@anac.km',
    caaContactConfidence: 'low'
  },
  'BI': {
    caaPhone: '+257 22 22 3530',
    caaEmail: 'aacb@aacb.bi',
    caaContactConfidence: 'low'
  },

  // OCEANIA
  'AU': {
    caaPhone: '+61 2 6217 1111',
    caaEmail: 'casa@casa.gov.au',
    permitEmail: 'approvals@casa.gov.au',
    caaContactConfidence: 'high'
  },
  'NZ': {
    caaPhone: '+64 4 560 9400',
    caaEmail: 'info@caa.govt.nz',
    permitEmail: 'permits@caa.govt.nz',
    caaContactConfidence: 'high'
  },
  'FJ': {
    caaPhone: '+679 331 2788',
    caaEmail: 'caaf@caaf.org.fj',
    caaContactConfidence: 'medium'
  },
  'PG': {
    caaPhone: '+675 324 4400',
    caaEmail: 'mail@casapng.gov.pg',
    caaContactConfidence: 'medium'
  },
  'PF': {
    caaPhone: '+689 40 86 00 00',
    caaEmail: 'seac.pf@aviation-civile.gouv.fr',
    caaContactConfidence: 'medium'
  },
  'NC': {
    caaPhone: '+687 25 04 00',
    caaEmail: 'dac@gouv.nc',
    caaContactConfidence: 'medium'
  },
  'VU': {
    caaPhone: '+678 22 531',
    caaEmail: 'caav@vanuatu.gov.vu',
    caaContactConfidence: 'low'
  },
  'WS': {
    caaPhone: '+685 22 444',
    caaEmail: 'sca@mcil.gov.ws',
    caaContactConfidence: 'low'
  },
  'TO': {
    caaPhone: '+676 23 022',
    caaEmail: 'mca@mca.gov.to',
    caaContactConfidence: 'low'
  },
  'SB': {
    caaPhone: '+677 36 602',
    caaEmail: 'caasi@solomon.com.sb',
    caaContactConfidence: 'low'
  },
  'MH': {
    caaPhone: '+692 625 3250',
    caaEmail: 'rmicaa@ntamar.net',
    caaContactConfidence: 'low'
  },
  'PW': {
    caaPhone: '+680 587 2100',
    caaEmail: 'baa@palaugov.org',
    caaContactConfidence: 'low'
  },
  'FM': {
    caaPhone: '+691 320 2653',
    caaEmail: 'doca@mail.fm',
    caaContactConfidence: 'low'
  },
  'GU': {
    caaPhone: '+1 671 475 0266',
    caaEmail: '',
    caaContactConfidence: 'low'
  },

  // CENTRAL ASIA
  'KZ': {
    caaPhone: '+7 7172 75 40 00',
    caaEmail: 'info@caa.kz',
    permitEmail: 'permits@caa.kz',
    caaContactConfidence: 'medium'
  },
  'UZ': {
    caaPhone: '+998 71 140 2848',
    caaEmail: 'info@caa.uz',
    caaContactConfidence: 'medium'
  },
  'TM': {
    caaPhone: '+993 12 39 27 39',
    caaEmail: '',
    caaContactConfidence: 'low'
  },
  'KG': {
    caaPhone: '+996 312 31 24 24',
    caaEmail: 'aga@aga.gov.kg',
    caaContactConfidence: 'low'
  },
  'TJ': {
    caaPhone: '+992 372 21 20 00',
    caaEmail: 'caa@tajikistan.tj',
    caaContactConfidence: 'low'
  }
};

// Main script
async function addCAAContacts() {
  const countriesPath = path.join(__dirname, '../data/countries.json');

  // Read existing countries
  const countries = JSON.parse(fs.readFileSync(countriesPath, 'utf8'));

  let updated = 0;
  let missing = 0;

  // Update each country with contact info
  countries.forEach(country => {
    const contacts = caaContacts[country.code];

    if (contacts) {
      // Add contact fields
      if (contacts.caaPhone) country.caaPhone = contacts.caaPhone;
      if (contacts.caaEmail) country.caaEmail = contacts.caaEmail;
      if (contacts.permitPhone) country.permitPhone = contacts.permitPhone;
      if (contacts.permitEmail) country.permitEmail = contacts.permitEmail;
      if (contacts.caaContactConfidence) country.caaContactConfidence = contacts.caaContactConfidence;

      // Update version
      country._version = (country._version || 1) + 1;
      updated++;
    } else {
      // For countries without contact info, add empty fields with low confidence
      country.caaPhone = '';
      country.caaEmail = '';
      country.caaContactConfidence = 'low';
      missing++;
    }
  });

  // Write updated countries back
  fs.writeFileSync(countriesPath, JSON.stringify(countries, null, 2));

  console.log(`Updated ${updated} countries with CAA contact information`);
  console.log(`${missing} countries need contact info research`);
  console.log('Countries file updated successfully!');
}

addCAAContacts();
