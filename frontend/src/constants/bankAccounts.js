import mandiriLogo from '../assets/logo-mandiri.svg';
import bcaLogo from '../assets/logo-bca.svg';
import bniLogo from '../assets/logo-bni.svg';
import qrisLogo from '../assets/logo-qris.svg';
import qrisImg from '../assets/qris.png';

// Rekening Bank & QRIS Resmi untuk Pembayaran Manual
export const OFFICIAL_BANK_ACCOUNTS = [
  {
    id: 'qris',
    bank: 'QRIS Gopay Merchant (Semua Bank & E-Wallet)',
    shortName: 'QRIS',
    accountNumber: 'ID1026596867808',
    accountName: 'TRIWALA DIGITAL, DIGITAL & KREATIF',
    color: '#00A859',
    bg: '#E8F8EE',
    badge: 'Scan Bebas Admin',
    logo: qrisLogo,
    isQris: true,
    qrisImage: qrisImg,
    nmid: 'ID1026596867808',
  },
  {
    id: 'mandiri',
    bank: 'Bank Mandiri',
    shortName: 'Mandiri',
    accountNumber: '133-0011-409-331',
    accountName: 'Triwala Mitra Bestari',
    color: '#002B66',
    bg: '#EDF3FB',
    badge: 'Bank Mandiri',
    logo: mandiriLogo,
    isQris: false,
  },
  {
    id: 'bca',
    bank: 'Bank Central Asia (BCA)',
    shortName: 'BCA',
    accountNumber: '0954152045',
    accountName: 'Triwala Mitra Bestari',
    color: '#005baa',
    bg: '#EEF6FD',
    badge: 'Verifikasi Cepat',
    logo: bcaLogo,
    isQris: false,
  },
  {
    id: 'bni',
    bank: 'Bank Negara Indonesia (BNI)',
    shortName: 'BNI',
    accountNumber: '0973607008',
    accountName: 'Triwala Mitra Bestari',
    color: '#F15A24',
    bg: '#FEF3EE',
    badge: 'Bank BUMN',
    logo: bniLogo,
    isQris: false,
  },
];

export const PT_COMPANY_NAME = 'Triwala Mitra Bestari';
export const QRIS_MERCHANT_NAME = 'TRIWALA DIGITAL, DIGITAL & KREATIF';
export const QRIS_NMID = 'ID1026596867808';
