import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth'; // <-- TAMBAHAN: Memanggil gerbang Login

// --- SOUND ENGINE ---
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'correct') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'victory') {
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
        gain.gain.setValueAtTime(0.1, ctx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + index * 0.12 + 0.4);
        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.4);
      });
    } else if (type === 'defeat') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    }
  } catch (e) {
    console.log("AudioContext disekat atau tidak disokong");
  }
};

// --- DATA & KONFIGURASI ---
const REGIONS = [
  { id: 1, name: "Hutan Aritmatika", desc: "Mulai petualangan di rimba hijau & rawa penjumlahan untuk mengumpulkan kunci kuno angka dasar.", min: 1, max: 15, theme: "from-emerald-950 via-teal-900 to-green-950", icon: "🌲", accent: "text-emerald-400", posX: "16%", posY: "60%", posXMobile: "50%", posYMobile: "85%", imgSrc: "/hutan.png" },
  { id: 2, name: "Dimensi Bilangan", desc: "Menuruni kawah vulkanik bilangan bulat yang ekstrem & mendaki kuil kristal pecahan es.", min: 16, max: 30, theme: "from-purple-950 via-violet-900 to-indigo-950", icon: "🌋", accent: "text-purple-400", posX: "32%", posY: "32%", posXMobile: "25%", posYMobile: "68%", imgSrc: "/dimensi.png" },
  { id: 3, name: "Lembah Aljabar", desc: "Memecahkan teka-teki sirkuit kuno & gerbang sihir rahasia pencarian variabel x misterius.", min: 31, max: 32, theme: "from-blue-950 via-sky-900 to-slate-900", icon: "🔮", accent: "text-sky-400", posX: "50%", posY: "65%", posXMobile: "75%", posYMobile: "50%", imgSrc: "/lembah.png" },
  { id: 4, name: "Gurun Perbandingan", desc: "Berdagang bijak di pasar gurun yang terik & mengendalikan gerbang pasir dengan proporsi tepat.", min: 33, max: 35, theme: "from-amber-950 via-orange-900 to-yellow-950", icon: "⚖️", accent: "text-amber-400", posX: "66%", posY: "35%", posXMobile: "25%", posYMobile: "32%", imgSrc: "/gurun.png" },
  { id: 5, name: "Istana Geometri", desc: "Istana megah terapung dengan arsitektur ubin simetris pelindung singgasana lingkaran sihir.", min: 36, max: 40, theme: "from-rose-950 via-red-900 to-stone-950", icon: "🏰", accent: "text-rose-400", posX: "85%", posY: "50%", posXMobile: "65%", posYMobile: "12%", imgSrc: "/istana.png" }
];

const LEVEL_NAMES = {
  1: "Gerbang Penjumlahan I (Satuan + Satuan)", 2: "Gerbang Penjumlahan II (Puluhan + Satuan/Puluhan)", 3: "Gerbang Penjumlahan III (Ratusan + Puluhan/Ratusan)", 4: "Rawa Pengurangan I (Satuan - Satuan)", 5: "Rawa Pengurangan II (Puluhan - Satuan/Puluhan)", 6: "Rawa Pengurangan III (Ratusan - Puluhan/Ratusan)", 7: "Labirin Perkalian I (Satuan x Satuan)", 8: "Labirin Perkalian II (Puluhan x Satuan/Puluhan)", 9: "Labirin Perkalian III (Ratusan x Puluhan/Ratusan)", 10: "Air Terjun Pembagian I (Puluhan : Satuan = Satuan)", 11: "Air Terjun Pembagian II (Ratusan : Satuan/Puluhan = Satuan/Puluhan)", 12: "Air Terjun Pembagian III (Ribuan : Satuan/Puluhan = Puluhan/Ratusan)", 13: "Benteng Campuran I (Campuran Satuan)", 14: "Benteng Campuran II (Campuran Satuan & Puluhan)", 15: "💀 [BOSS] KUKURUNDA (Campuran Satuan, Puluhan & Ratusan)", 16: "Penjumlahan Bilangan Bulat", 17: "Penjumlahan Bulat (Soal Cerita)", 18: "Pengurangan Bilangan Bulat", 19: "Pengurangan Bulat (Soal Cerita)", 20: "Perkalian Bilangan Bulat", 21: "Perkalian Bulat (Soal Cerita)", 22: "Pembagian Bilangan Bulat", 23: "Pembagian Bulat (Soal Cerita)", 24: "Campuran Bilangan Bulat", 25: "🛡️ [MINI BOSS] Campuran Bulat (Cerita)", 26: "Jembatan Pecahan (+)", 27: "Jembatan Pecahan (-)", 28: "Kebun Pecahan (x)", 29: "Kebun Pecahan (:)", 30: "💀 [BOSS] Penguasa Kristal Pecahan", 31: "Teka-teki 1 Variabel I", 32: "Teka-teki 1 Variabel II", 33: "Pasar Gurun (Perbandingan Senilai)", 34: "Oasis Waktu (Perbandingan Berbalik Nilai)", 35: "🛡️ [MINI BOSS] Ujian Firaun (Perbandingan Campuran)", 36: "Kamar Persegi (Luas & Keliling)", 37: "Aula Persegi Panjang (Luas & Keliling)", 38: "Menara Segitiga (Luas & Keliling)", 39: "Taman Trapesium (Luas & Keliling)", 40: "💀 [FINAL BOSS] Singgasana Lingkaran (Luas & Keliling)"
};

const ENEMIES = {
  normal: [
    { name: "Slime Angka", emoji: "🟩" }, { name: "Goblins Pengurang", emoji: "👺" }, { name: "Serigala Kelipatan", emoji: "🐺" }, { name: "Robot Pembagi", emoji: "🤖" }, { name: "Kelelawar Minus", emoji: "🦇" }
  ],
  boss: {
    15: { name: "Raja KUKURUNDA", emoji: "👹", desc: "Dewa Tertinggi Hitung Campuran!" },
    25: { name: "Golem Bilangan Bulat", emoji: "🪨", desc: "Monster Batu Suhu Ekstrem!" },
    30: { name: "Ratu Kristal Pecahan", emoji: "🔮", desc: "Penguasa Belahan Dimensi Es!" },
    35: { name: "Firaun Rasio", emoji: "🧟", desc: "Penjaga Neraca Keadilan Kuno!" },
    40: { name: "Naga Geometri", emoji: "🐉", desc: "Raja Terakhir Pelindung Singgasana Lingkaran!" }
  }
};

const AVATARS = [
  { id: "knight", name: "Ksatria Aritmatika", emoji: "🛡️" },
  { id: "wizard", name: "Penyihir Aljabar", emoji: "🧙‍♂️" },
  { id: "monster", name: "Monster Aritmatika", emoji: "👾" }
];

// --- LOGIKA GENERATOR SOAL ---
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const simplify = (n, d) => {
  let divisor = gcd(Math.abs(n), Math.abs(d));
  n = n / divisor; d = d / divisor;
  if (d < 0) { n = -n; d = -d; }
  if (d === 1) return `${n}`;
  if (n === 0) return `0`;
  return `${n}/${d}`;
};
const makeUniqueOptions = (ansStr, ...fakes) => {
  let res = new Set([ansStr]);
  for (let f of fakes) { if (res.size < 4) res.add(f); }
  let fallbacks = ["1/2", "3/4", "1/3", "2/3", "1/4", "2/5", "1", "2", "3", "3/2", "4/3", "5/4"];
  let i = 0;
  while(res.size < 4 && i < fallbacks.length) { res.add(fallbacks[i]); i++; }
  return Array.from(res);
};

const generateQuestion = (level) => {
  let q = "", ans = 0, options = [];
  
  if (level === 1) {
    let a = rand(1, 9), b = rand(1, 9); q = `Berapa hasil dari ${a} + ${b}?`; ans = a + b;
  } else if (level === 2) {
    let a = rand(10, 99), b = (rand(0, 1) === 1) ? rand(10, 99) : rand(1, 9); q = `Berapa hasil dari ${a} + ${b}?`; ans = a + b;
  } else if (level === 3) {
    let a = rand(100, 999), b = (rand(0, 1) === 1) ? rand(100, 999) : rand(10, 99); q = `Berapa hasil dari ${a} + ${b}?`; ans = a + b;
  } else if (level === 4) {
    let a = rand(2, 9), b = rand(1, a - 1); q = `Berapa hasil dari ${a} - ${b}?`; ans = a - b;
  } else if (level === 5) {
    let a = rand(10, 99), b = (rand(0, 1) === 1) ? rand(10, a - 1) : rand(1, 9); if (a === 10 && b === 10) b = rand(1, 9); q = `Berapa hasil dari ${a} - ${b}?`; ans = a - b;
  } else if (level === 6) {
    let a = rand(100, 999), b = (rand(0, 1) === 1) ? rand(100, a - 1) : rand(10, 99); q = `Berapa hasil dari ${a} - ${b}?`; ans = a - b;
  } else if (level === 7) {
    let a = rand(1, 9), b = rand(1, 9); q = `Berapa hasil dari ${a} x ${b}?`; ans = a * b;
  } else if (level === 8) {
    let a = rand(10, 99), b = (rand(0, 1) === 1) ? rand(10, 20) : rand(2, 9); q = `Berapa hasil dari ${a} x ${b}?`; ans = a * b;
  } else if (level === 9) {
    let a = rand(100, 499), b = (rand(0, 1) === 1) ? rand(10, 20) : rand(100, 150); q = `Berapa hasil dari ${a} x ${b}?`; ans = a * b;
  } else if (level === 10) {
    let ans_temp = rand(1, 9), b = rand(2, 9), a = b * ans_temp; while (a < 10 || a > 99) { ans_temp = rand(1, 9); b = rand(2, 9); a = b * ans_temp; }
    q = `Berapakah hasil dari ${a} : ${b}?`; ans = ans_temp;
  } else if (level === 11) {
    let ans_temp = (rand(0, 1) === 1) ? rand(1, 9) : rand(10, 99); let b = (rand(0, 1) === 1) ? rand(2, 9) : rand(10, 99); let a = b * ans_temp;
    while (a < 100 || a > 999) { ans_temp = (rand(0, 1) === 1) ? rand(1, 9) : rand(10, 99); b = (rand(0, 1) === 1) ? rand(2, 9) : rand(10, 99); a = b * ans_temp; }
    q = `Berapakah hasil dari ${a} : ${b}?`; ans = ans_temp;
  } else if (level === 12) {
    let ans_temp = (rand(0, 1) === 1) ? rand(10, 99) : rand(100, 999); let b = (rand(0, 1) === 1) ? rand(2, 9) : rand(10, 99); let a = b * ans_temp;
    while (a < 1000 || a > 9999) { ans_temp = (rand(0, 1) === 1) ? rand(10, 99) : rand(100, 999); b = (rand(0, 1) === 1) ? rand(2, 9) : rand(10, 99); a = b * ans_temp; }
    q = `Berapakah hasil dari ${a} : ${b}?`; ans = ans_temp;
  } else if (level === 13) {
    let a = rand(2, 9), b = rand(2, 9), c = rand(2, 9);
    if (rand(0, 1) === 1) { q = `Berapa hasil dari ${a} x ${b} + ${c}?`; ans = (a * b) + c; } 
    else { q = `Berapa hasil dari ${a} + ${b} x ${c}? (Ingat urutan Kabataku)`; ans = a + (b * c); }
  } else if (level === 14) {
    let a = rand(10, 30), b = rand(2, 9), c = rand(10, 25);
    if (rand(0, 1) === 1) { q = `Berapa hasil dari ${a} x ${b} - ${c}?`; ans = (a * b) - c; } 
    else { let aSatuan = rand(2, 9), bSatuan = rand(2, 9); q = `Berapa hasil dari (${a} + ${aSatuan}) x ${bSatuan}?`; ans = (a + aSatuan) * bSatuan; }
  } else if (level === 15) {
    let a = rand(100, 200), b = rand(10, 50), c = rand(2, 5), d = rand(10, 100); q = `BOS: Berapa hasil dari (${a} + ${b}) x ${c} - ${d}?`; ans = ((a + b) * c) - d;
  } else if (level === 16) {
    let a = rand(-99, 99), b = rand(-99, 99); q = `Berapa hasil dari ${a} + ${b < 0 ? '('+b+')' : b}?`; ans = a + b;
  } else if (level === 17) {
    let a = rand(-30, 30), b = rand(-25, 25); if (b === 0) b = 5; let action = b > 0 ? "naik" : "turun";
    q = `Suhu awal di sebuah laboratorium uji coba adalah ${a}°C. Kemudian suhu ${action} sebesar ${Math.abs(b)}°C. Berapa suhu ruangan tersebut sekarang?`; ans = a + b;
  } else if (level === 18) {
    let a = rand(-99, 99), b = rand(-99, 99); q = `Berapa hasil dari ${a} - ${b < 0 ? '('+b+')' : b}?`; ans = a - b;
  } else if (level === 19) {
    let a = rand(10, 50), b = rand(-50, -10); q = `Seekor helikopter terbang pada ketinggian ${a} m di atas permukaan laut. Tepat di bawahnya, sebuah kapal selam berada pada kedalaman ${Math.abs(b)} m di bawah laut (posisi ${b} m). Berapa selisih jarak antara helikopter dan kapal selam tersebut?`; ans = a - b;
  } else if (level === 20) {
    let a = rand(-30, 30), b = rand(-30, 30); if (a === 0) a = -2; if (b === 0) b = 4; q = `Berapa hasil dari ${a} x ${b < 0 ? '('+b+')' : b}?`; ans = a * b;
  } else if (level === 21) {
    let a = rand(-15, -2), b = rand(2, 9); q = `Dalam sebuah kompetisi, setiap pelanggaran akan diberi poin ${a}. Jika tim Anda melakukan pelanggaran sebanyak ${b} kali, berapakah total poin yang Anda peroleh dari pelanggaran tersebut?`; ans = a * b;
  } else if (level === 22) {
    let b = rand(-30, 30); if (b === 0) b = -5; let ans_temp = rand(-40, 40), a = b * ans_temp; while (Math.abs(a) < 10) { ans_temp = rand(-40, 40); a = b * ans_temp; }
    q = `Berapakah hasil dari ${a} : ${b < 0 ? '('+b+')' : b}?`; ans = ans_temp;
  } else if (level === 23) {
    let b = rand(2, 10), ans_temp = rand(-50, -10), a = b * ans_temp; q = `Sebuah koperasi dagang mengalami kerugian sehingga total kasnya berubah menjadi ${a} rupiah. Jika kerugian tersebut ditanggung sama rata oleh ${b} anggotanya, berapa perubahan saldo yang dialami masing-masing anggota?`; ans = ans_temp;
  } else if (level === 24) {
    let a = rand(-20, 20), b = rand(-15, 15), c = rand(-40, 40);
    if (rand(0, 1) === 1) { q = `Berapa hasil dari ${a} x ${b < 0 ? '('+b+')' : b} + ${c < 0 ? '('+c+')' : c}?`; ans = (a * b) + c; } 
    else { q = `Berapa hasil dari ${a < 0 ? '('+a+')' : a} - ${b < 0 ? '('+b+')' : b} x ${c < 0 ? '('+c+')' : c}?`; ans = a - (b * c); }
  } else if (level === 25) {
    let a = rand(-5, 15), b = rand(-8, -2), c = rand(2, 6); q = `MINI BOSS: Suhu udara di puncak gunung pada pukul 06.00 adalah ${a}°C. Menjelang malam badai tiba dan suhu berubah sebesar ${b}°C (turun) setiap jam. Berapakah suhu udara di puncak tersebut setelah ${c} jam berlalu?`; ans = a + (b * c);
  } else if (level === 26) {
    let d1 = rand(2, 6), d2 = rand(2, 6), n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1); q = `Jembatan Pecahan: ${n1}/${d1} + ${n2}/${d2} = ... ?`;
    let num = n1 * d2 + n2 * d1, den = d1 * d2; ans = simplify(num, den); options = makeUniqueOptions(ans, simplify(num + 1, den), simplify(Math.max(1, num - 1), den), simplify(num + 2, den));
  } else if (level === 27) {
    let d1 = rand(2, 6), d2 = rand(2, 6), n1 = rand(1, d1 - 1), n2 = rand(1, d2 - 1); if (n1 * d2 <= n2 * d1) { n1 = d1 - 1; n2 = 1; d2 = Math.max(d2, 3); } 
    q = `Potong Jembatan: ${n1}/${d1} - ${n2}/${d2} = ... ?`; let num = n1 * d2 - n2 * d1, den = d1 * d2; ans = simplify(num, den); options = makeUniqueOptions(ans, simplify(num + 1, den), simplify(Math.max(1, num - 1), den), simplify(num + 2, den));
  } else if (level === 28) {
    let d1 = rand(2, 5), d2 = rand(2, 5), n1 = rand(1, d1), n2 = rand(1, d2); q = `Kebun Pecahan: ${n1}/${d1} x ${n2}/${d2} = ... ?`;
    let num = n1 * n2, den = d1 * d2; ans = simplify(num, den); options = makeUniqueOptions(ans, simplify(num + 1, den), simplify(Math.max(1, num - 1), den), simplify(num + 2, den));
  } else if (level === 29) {
    let d1 = rand(2, 5), d2 = rand(2, 5), n1 = rand(1, d1), n2 = rand(1, d2); q = `Membagi Kebun: ${n1}/${d1} : ${n2}/${d2} = ... ?`;
    let num = n1 * d2, den = d1 * n2; ans = simplify(num, den); options = makeUniqueOptions(ans, simplify(num + 1, den), simplify(Math.max(1, num - 1), den), simplify(num + 2, den));
  } else if (level === 30) {
    if (rand(0, 1) === 0) {
        let num1 = rand(1,2), den1 = 3, num2 = rand(1,2), den2 = 3, num3 = rand(1,3), den3 = 4; q = `BOSS KRISTAL: (${num1}/${den1} + ${num2}/${den2}) x ${num3}/${den3} = ... (Sederhanakan)?`; ans = simplify((num1*den2 + num2*den1) * num3, (den1*den2) * den3);
    } else {
        let num1 = rand(1,3), den1 = 4, num2 = rand(1,2), den2 = 2, num3 = rand(1,2), den3 = 3; q = `BOSS KRISTAL: ${num1}/${den1} : (${num2}/${den2} x ${num3}/${den3}) = ... (Sederhanakan)?`; ans = simplify(num1 * (den2*den3), den1 * (num2*num3));
    }
    options = makeUniqueOptions(ans, simplify(1, 2), simplify(3, 4), simplify(1, 3));
  } else if (level === 31) {
    let x = rand(5, 50), type = rand(0, 2);
    if (type === 0) { let a = rand(2, 9); q = `Pintu Terkunci: Jika ${a}x = ${a * x}, berapakah nilai x?`; ans = x; } 
    else if (type === 1) { let b = rand(2, 30); q = `Buka Segel: Jika x + ${b} = ${x + b}, berapakah nilai x?`; ans = x; } 
    else { let b = rand(2, 30); q = `Buka Segel: Jika x - ${b} = ${x - b}, berapakah nilai x?`; ans = x; }
  } else if (level === 32) {
    let a = rand(2, 9), x = rand(2, 20), b = rand(2, 20);
    if (rand(0, 1) === 0) { q = `Retas Sirkuit: Jika ${a}x + ${b} = ${a * x + b}, berapakah nilai x?`; ans = x; } 
    else { q = `Retas Sirkuit: Jika ${a}x - ${b} = ${a * x - b}, berapakah nilai x?`; ans = x; }
  } else if (level === 33) {
    let items = [["kristal penyembuh", "keping emas"], ["gulungan sihir", "batu safir"], ["pedang perak", "koin perak"]]; let [itemA, itemB] = items[rand(0, 2)];
    let a = rand(2, 5), pricePerUnit = rand(3, 10), a2 = a + rand(2, 6); q = `Pasar Gurun: Jika harga ${a} ${itemA} adalah ${a * pricePerUnit} ${itemB}, berapakah harga untuk ${a2} ${itemA}?`; ans = a2 * pricePerUnit;
  } else if (level === 34) {
    let entities = [["golem pembangun", "hari"], ["penyihir waktu", "jam"], ["unta pengangkut", "hari"]]; let [entA, entB] = entities[rand(0, 2)], p1 = rand(2, 6), w1 = rand(10, 24), totalWork = p1 * w1;
    let possibleP2 = []; for (let i = 2; i <= totalWork; i++) { if (totalWork % i === 0 && i !== p1) possibleP2.push(i); }
    if (possibleP2.length === 0) possibleP2 = [p1 * 2]; let p2 = possibleP2[rand(0, possibleP2.length - 1)];
    q = `Oasis Waktu: Jika ${p1} ${entA} dapat menyelesaikan pekerjaan dalam ${w1} ${entB}, berapa ${entB} waktu yang dibutuhkan jika dikerjakan oleh ${p2} ${entA}?`; ans = totalWork / p2;
  } else if (level === 35) {
    if (rand(0, 1) === 0) {
      let a = rand(3, 7), price = rand(4, 12), a2 = a + rand(2, 5); q = `MINI BOSS (Perbandingan Senilai): Resep alkimia kuno membutuhkan ${a * price} tetes embun murni untuk meracik ${a} porsi ramuan. Berapa tetes embun yang dibutuhkan untuk membuat ${a2} porsi ramuan?`; ans = a2 * price;
    } else {
      let p1 = rand(3, 8), w1 = rand(12, 30), totalWork = p1 * w1;
      let possibleP2 = []; for (let i = 2; i <= totalWork; i++) { if (totalWork % i === 0 && i > p1) possibleP2.push(i); }
      if(possibleP2.length === 0) possibleP2 = [p1 * 2]; let p2 = possibleP2[rand(0, possibleP2.length - 1)];
      q = `MINI BOSS (Perbandingan Berbalik Nilai): Persediaan air suci di oasis cukup untuk ${p1} ksatria selama ${w1} hari. Jika jumlah ksatria bertambah menjadi ${p2}, dalam berapa hari persediaan air tersebut akan habis?`; ans = totalWork / p2;
    }
  } else if (level === 36) {
    let s = rand(5, 25);
    if (rand(0, 1) === 0) { q = `Kamar Persegi: Hitunglah LUAS ubin lantai kamar yang berbentuk persegi dengan panjang sisi ${s} m!`; ans = s * s; } 
    else { q = `Kamar Persegi: Hitunglah KELILING dinding kamar persegi yang memiliki panjang sisi ${s} m untuk memasang pita perisai!`; ans = 4 * s; }
  } else if (level === 37) {
    let p = rand(12, 30), l = rand(5, 11);
    if (rand(0, 1) === 0) { q = `Aula Persegi Panjang: Aula istana berbentuk persegi panjang berukuran panjang ${p} m dan lebar ${l} m. Berapakah LUAS karpet megah yang dapat menutupi seluruh lantainya?`; ans = p * l; } 
    else { q = `Aula Persegi Panjang: Aula istana berukuran panjang ${p} m dan lebar ${l} m. Berapakah KELILING aula tersebut untuk dijaga oleh prajurit?`; ans = 2 * (p + l); }
  } else if (level === 38) {
    let triples = [[3,4,5], [5,12,13], [6,8,10], [9,12,15], [8,15,17]]; let [a, t, c] = triples[rand(0, triples.length - 1)]; let mult = rand(2, 6); a *= mult; t *= mult; c *= mult;
    if (rand(0, 1) === 0) { q = `Menara Segitiga Siku-Siku: Jika panjang alas penopang ${a} m, tinggi menara ${t} m, dan sisi miring baja ${c} m, berapakah LUAS menara segitiga tersebut?`; ans = (a * t) / 2; } 
    else { q = `Menara Segitiga Siku-Siku: Jika panjang alas penopang ${a} m, tinggi menara ${t} m, dan sisi miring baja ${c} m, berapakah panjang KELILING penyangga luarnya?`; ans = a + t + c; }
  } else if (level === 39) {
    let configs = [{a: 10, b: 20, t: 12, s: 13}, {a: 6, b: 14, t: 3, s: 5}, {a: 8, b: 24, t: 6, s: 10}]; let conf = configs[rand(0, configs.length - 1)]; let mult = rand(2, 5); let a = conf.a * mult, b = conf.b * mult, t = conf.t * mult, s = conf.s * mult;
    if (rand(0, 1) === 0) { q = `Taman Trapesium Sama Kaki: Panjang dua sisi yang sejajar adalah ${a} m and ${b} m. Jika tinggi taman ${t} m (dan sisi miring ${s} m), berapakah LUAS taman istana tersebut?`; ans = ((a + b) * t) / 2; } 
    else { q = `Taman Trapesium Sama Kaki: Panjang dua sisi yang sejajar adalah ${a} m and ${b} m, dengan panjang dua sisi miring yang masing-masing ${s} m. Berapakah panjang KELILING pagar yang dibutuhkan?`; ans = a + b + s + s; }
  } else if (level === 40) {
    let r = rand(2, 10) * 7;
    if (rand(0, 1) === 0) { q = `FINAL BOSS: Kutukan Lingkaran! Radius (jari-jari) sihir singgasana adalah ${r} m. Untuk mematahkannya, sebutkan LUAS lingkaran sihir tersebut! (Gunakan π = 22/7)`; ans = (22 * r * r) / 7; } 
    else { q = `FINAL BOSS: Rantai Lingkaran! Radius (jari-jari) ruangan adalah ${r} m. Untuk memutusnya, sebutkan panjang KELILING rantai pelindung tersebut! (Gunakan π = 22/7)`; ans = (2 * 22 * r) / 7; }
  }

  if (options.length === 0) {
    let scale = 1; if (ans > 100) scale = 10; if (ans > 1000) scale = 100;
    let wrong1 = ans + rand(1, 4) * scale, wrong2 = ans - rand(1, 5) * scale, wrong3 = ans + rand(5, 9) * scale;
    while (wrong1 === ans) wrong1 += 1 * scale;
    while (wrong2 === ans || wrong2 === wrong1) wrong2 -= 1 * scale; 
    while (wrong3 === ans || wrong3 === wrong1 || wrong3 === wrong2) wrong3 += 1 * scale;
    options = [ans, wrong1, wrong2, wrong3];
  }
  return { question: q, answer: ans, options: shuffle(options) };
};

// --- KOMPONEN UTAMA GAME ---
export default function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // --- TAMBAHAN: State untuk Autentikasi ---
  const [session, setSession] = useState(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    
    // --- TAMBAHAN: Listener Login Supabase ---
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      subscription.unsubscribe();
    };
  }, []);
// Kode untuk mengambil data pemain dari Supabase
  useEffect(() => {
    if (session?.user?.email) {
      const fetchPlayerData = async () => {
        const { data, error } = await supabase
          .from('player_progress')
          .select('*')
          .eq('username', session.user.email)
          .single();

        if (data) {
          setGold(data.gold || 100);
          setXp(data.xp || 0);
          setMaxUnlockedLevel(data.max_unlocked_level || 1);
          if (data.level_stats) setLevelStats(data.level_stats);
        }
      };
      fetchPlayerData();
    } else {
      // Reset data ke angka awal jika pemain belum login
      setGold(100);
      setXp(0);
      setMaxUnlockedLevel(1);
      setLevelStats({});
    }
  }, [session]);
  const [currentPage, setCurrentPage] = useState('MAP'); 
  const [activeRegion, setActiveRegion] = useState(null);
  const [activeLevel, setActiveLevel] = useState(null);
  
  const [hero, setHero] = useState(AVATARS[0]); 
  const [gold, setGold] = useState(100);
  const [xp, setXp] = useState(0);
  const [levelStats, setLevelStats] = useState({}); 
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState(1);
  const [isShake, setIsShake] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStatus, setGameStatus] = useState('playing'); 
  const [hearts, setHearts] = useState(3); 
  const [enemyHealth, setEnemyHealth] = useState(100); 
  const [currentEnemy, setCurrentEnemy] = useState({ name: "Slime", emoji: "🟩", desc: "" });

  const startNewBattle = (level) => {
    setActiveLevel(level);
    const isBossLevel = level === 15 || level === 25 || level === 30 || level === 35 || level === 40;
    if (isBossLevel) {
      setCurrentEnemy({ name: ENEMIES.boss[level].name, emoji: ENEMIES.boss[level].emoji, desc: ENEMIES.boss[level].desc });
    } else {
      const randomEnemy = ENEMIES.normal[rand(0, ENEMIES.normal.length - 1)];
      setCurrentEnemy({ name: randomEnemy.name, emoji: randomEnemy.emoji, desc: "Monster liar penghadang jalan utama!" });
    }

    const newQuestions = [];
    for(let i = 0; i < 10; i++) { newQuestions.push(generateQuestion(level)); }
    setQuestions(newQuestions);
    setCurrentQIndex(0); setScore(0); setHearts(3); setEnemyHealth(100);
    setGameStatus('playing'); setCurrentPage('GAME'); playSound('correct');
  };

  const getCurrentRegionId = () => {
    if (maxUnlockedLevel <= 15) return 1; if (maxUnlockedLevel <= 30) return 2;
    if (maxUnlockedLevel <= 32) return 3; if (maxUnlockedLevel <= 35) return 4; return 5;
  };

  const getRankTitle = () => {
    if (xp > 1500) return "Archmage Matematika 👑"; if (xp > 800) return "Slayer Monster 👾";
    if (xp > 300) return "Petualang Terampil 🛡️"; return "Pemula Aritmatika 🌱";
  };

  const triggerShake = () => { setIsShake(true); setTimeout(() => setIsShake(false), 500); };

  // --- FUNGSI CLOUD SAVE SUPABASE ---
  const evaluateGameEnd = async (finalScore) => {
    if (finalScore >= 7) {
      setGameStatus('won'); playSound('victory');
      let starsGained = finalScore === 10 ? 3 : (finalScore >= 8 ? 2 : 1);
      
      const goldReward = finalScore * 10;
      const xpReward = finalScore * 15;
      const newGold = gold + goldReward;
      const newXp = xp + xpReward;
      const nextLevel = activeLevel === maxUnlockedLevel && activeLevel < 40 ? activeLevel + 1 : maxUnlockedLevel;
      
      setGold(newGold); setXp(newXp);
      const newLevelStats = { ...levelStats, [activeLevel]: { stars: Math.max(levelStats[activeLevel]?.stars || 0, starsGained), highScore: Math.max(levelStats[activeLevel]?.highScore || 0, finalScore) } };
      setLevelStats(newLevelStats);
      setMaxUnlockedLevel(nextLevel);

      try {
        await supabase
          .from('player_progress')
          .upsert({
            // --- TAMBAHAN: Menggunakan Email Pemain yang Sedang Login ---
            username: session?.user?.email || 'Pemain_Anonim', 
            xp: newXp,
            gold: newGold,
            max_unlocked_level: nextLevel,
            level_stats: newLevelStats
          });
        console.log('Progres tersimpan di Supabase secara ajaib!');
      } catch (err) {
        console.error('Gagal simpan ke Supabase:', err);
      }
    } else { 
      setGameStatus('lost'); playSound('defeat'); 
    }
  };

  // --- HALAMAN 1: PETA DUNIA ---
  const Page1Map = () => {
    const handleLandmarkClick = (region) => {
      const isUnlocked = maxUnlockedLevel >= region.min;
      if (isUnlocked) {
        setActiveRegion(region); setCurrentPage('REGION'); playSound('correct');
      } else { playSound('wrong'); }
    };

    return (
      <div className="min-h-screen text-white font-sans relative overflow-hidden flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-600 via-blue-700 to-indigo-950 -z-10"></div>
        <div className="absolute inset-0 opacity-10 pointer-events-none -z-10 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute left-0 w-[200%] h-full animate-wave" style={{
              animationDuration: `${15 + i * 5}s`, animationDelay: `-${i * 3}s`, top: `${i * 15}%`,
              backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.4) 0%, transparent 50%)', backgroundSize: '200px 40px', backgroundRepeat: 'repeat-x'
            }}></div>
          ))}
        </div>

        <div className="absolute top-16 left-0 text-6xl opacity-25 animate-cloud-slow pointer-events-none z-10 select-none">☁️</div>
        <div className="absolute top-44 left-0 text-7xl opacity-20 animate-cloud-fast pointer-events-none z-10 select-none">☁️</div>
        
        <header className="relative z-20 max-w-6xl mx-auto w-full pt-6 px-6 flex-shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-center bg-[#114b5f]/95 border-[4px] border-teal-800 rounded-3xl p-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 mb-3 md:mb-0">
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center text-3xl shadow-lg border-2 border-amber-300 animate-hero-bounce">
                {hero.emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-400">{hero.name}</span>
                  <span className="text-[10px] bg-amber-500/25 border border-amber-500/50 text-amber-300 px-2 py-0.5 rounded-full font-bold">LV. {Math.floor(xp/200) + 1}</span>
                </div>
                {/* --- TAMBAHAN: Tombol Logout --- */}
                <div className="flex items-center gap-2">
                   <p className="text-xs text-slate-300 font-medium">Gelar: <span className="text-teal-300 font-bold">{getRankTitle()}</span></p>
                   <button onClick={() => supabase.auth.signOut()} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded hover:bg-red-500/40 transition-colors">Keluar Akun</button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 md:gap-6 bg-slate-950/70 px-4 py-2 rounded-xl border-2 border-teal-800 text-sm">
              <div className="text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">EXP</span>
                <span className="font-black text-blue-300">{xp} XP</span>
              </div>
              <div className="w-px h-8 bg-teal-800"></div>
              <div className="text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Emas</span>
                <span className="font-black text-amber-300">🪙 {gold}</span>
              </div>
              <div className="w-px h-8 bg-teal-800"></div>
              <div className="text-center">
                <span className="block text-[9px] text-slate-400 font-bold uppercase">Misi Selesai</span>
                <span className="font-black text-teal-300 font-extrabold">{Object.keys(levelStats).filter(l => levelStats[l]?.stars >= 1).length}/40</span>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2 justify-center items-center">
            <span className="text-xs text-slate-300">Ganti Avatar Hero:</span>
            {AVATARS.map(av => (
              <button key={av.id} onClick={() => { setHero(av); playSound('correct'); }} className={`px-3 py-1 rounded-lg border-2 text-xs font-bold flex items-center gap-1 transition-all ${hero.id === av.id ? 'bg-amber-500 border-amber-300 text-slate-950 scale-105 shadow-md' : 'bg-slate-900/80 border-teal-800 hover:border-teal-600'}`}>
                <span>{av.emoji}</span>
                <span>{av.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </header>

        <main className="relative z-10 flex-grow max-w-7xl mx-auto w-full px-4 md:px-6 py-4 flex flex-col justify-center">
          <div className="text-center mb-6 flex-shrink-0 select-none">
            <h1 className="text-2xl md:text-3.5xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.7)]" style={{ fontFamily: "'Lilita One', cursive" }}>Peta Petualangan Numerika</h1>
            <p className="text-xs text-slate-300/90 font-medium drop-shadow-md mt-1" style={{ fontFamily: "'Fredoka', sans-serif" }}>Ketuk salah satu pulau untuk memulai perjalanan misi tantangan!</p>
          </div>

          <div className="relative w-full flex-grow min-h-[700px] md:min-h-[600px] border-[8px] md:border-[12px] border-[#0a2342] rounded-[3rem] overflow-hidden shadow-[0_16px_30px_rgba(0,0,0,0.6)] bg-[#023e8a]"
            style={{ backgroundImage: "url('/background1.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
            
            <div className="absolute bottom-6 left-6 opacity-30 pointer-events-none z-0 text-5xl md:text-8xl animate-compass select-none">🧭</div>
            <div className="absolute top-[55%] left-[25%] text-xl md:text-3xl opacity-35 animate-boat pointer-events-none z-0 select-none">Base ⛵</div>
            <div className="absolute bottom-[22%] left-[64%] text-2xl md:text-4xl opacity-15 pointer-events-none z-0 select-none animate-pulse">🦑</div>

            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-0 drop-shadow-md" xmlns="http://www.w3.org/2000/svg">
              <path d={isMobile ? "M 50 85 Q 35 76 25 68 Q 50 59 75 50 Q 50 41 25 32 Q 45 22 65 12" : "M 16 60 Q 24 45 32 32 Q 41 50 50 65 Q 58 50 66 35 Q 75 42 85 50"} fill="none" stroke="#ffffff" strokeWidth={isMobile ? "1" : "1.5"} strokeLinecap="round" strokeDasharray="2, 6" className="animate-march" opacity="0.6"/>
            </svg>

            {REGIONS.map((region) => {
              const isUnlocked = maxUnlockedLevel >= region.min;
              const currentRegionId = getCurrentRegionId();
              const isActive = currentRegionId === region.id;
              const xPos = isMobile ? region.posXMobile : region.posX;
              const yPos = isMobile ? region.posYMobile : region.posY;

              return (
                <div key={region.id} style={{ left: xPos, top: yPos }} className="absolute -translate-x-1/2 -translate-y-1/2 z-10 hover:z-40 transition-all duration-300">
                  {isActive && (
                    <div className="absolute -top-[60px] md:-top-[80px] left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none select-none">
                      <div className="animate-pin filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
                        <svg width={isMobile ? "30" : "40"} height={isMobile ? "30" : "40"} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="#ea580c"/>
                          <circle cx="12" cy="9" r={isMobile ? "2" : "2.5"} fill="#ffffff" />
                        </svg>
                      </div>
                      <span className="bg-[#ea580c] text-white font-black text-[7px] md:text-[8px] uppercase px-2 py-0.5 rounded-full shadow-lg border border-orange-400 tracking-wider mt-1 whitespace-nowrap">Misi Aktif</span>
                    </div>
                  )}

                  <button onClick={() => handleLandmarkClick(region)} className={`group relative w-40 h-40 md:w-64 md:h-64 flex flex-col items-center justify-center focus:outline-none ${isUnlocked ? 'cursor-pointer hover:scale-110 transition-transform duration-300' : 'opacity-50 cursor-not-allowed grayscale'}`}>
                    <img src={region.imgSrc} alt={region.name} className={`absolute inset-0 w-full h-full object-contain transition-transform duration-500 group-hover:-translate-y-3 ${isActive ? 'drop-shadow-[0_0_15px_rgba(255,255,255,0.7)]' : 'drop-shadow-xl'}`} />
                    <span className="absolute -bottom-4 md:-bottom-6 flex flex-col items-center bg-[#0f172a]/95 border border-white/20 px-4 py-1.5 rounded-xl text-[9px] md:text-sm font-black tracking-wide text-slate-100 shadow-[0_4px_10px_rgba(0,0,0,0.5)] z-20 whitespace-nowrap transition-transform duration-500 group-hover:-translate-y-2 group-hover:border-amber-400">
                      <span className="uppercase">{region.name}</span>
                      {isUnlocked ? <span className="text-[8px] md:text-[10px] text-amber-300 font-bold mt-0.5">Lv. {region.min}-{region.max}</span> : <span className="text-[8px] md:text-[10px] text-red-400 font-bold mt-0.5">TERKUNCI</span>}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-6 flex-shrink-0">
            <button onClick={() => { setMaxUnlockedLevel(40); playSound('victory'); }} className="bg-slate-900/90 hover:bg-slate-800 text-xs text-amber-400 hover:text-amber-300 border-2 border-teal-800 px-5 py-2 rounded-full font-bold tracking-wide transition-all shadow-md active:scale-95">
              🔓 [Mode Guru] Buka Semua Jalur Lanskap Petualangan
            </button>
          </div>
        </main>
      </div>
    );
  };

  // --- HALAMAN 2: PETA LEVEL (REGION MAP) ---
  const Page2Region = () => {
    const levels = []; for (let i = activeRegion.min; i <= activeRegion.max; i++) { levels.push(i); }

    return (
      <div className={`min-h-screen bg-gradient-to-b ${activeRegion.theme} text-white p-6 font-sans flex flex-col relative`}>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto w-full flex-grow relative z-10">
          <div className="flex justify-between items-center mb-8 bg-black/40 p-4 rounded-2xl backdrop-blur-md border border-white/5">
            <button onClick={() => { setCurrentPage('MAP'); playSound('correct'); }} className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 hover:scale-105 border border-white/10 px-4 py-2 rounded-xl transition-all">
              ⬅ Kembali ke Peta Utama
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeRegion.icon}</span>
              <div>
                <h4 className="text-sm font-bold">{activeRegion.name}</h4>
                <p className="text-[10px] text-slate-300">Level Terbuka: {maxUnlockedLevel}</p>
              </div>
            </div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-black mb-2 drop-shadow-md tracking-wide">{activeRegion.name}</h1>
            <p className="text-sm text-slate-300 max-w-md mx-auto">{activeRegion.desc}</p>
          </div>

          <div className="bg-slate-950/60 border border-white/5 rounded-3xl p-8 backdrop-blur-md max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {levels.map((lvl) => {
                const isUnlocked = lvl <= maxUnlockedLevel;
                const isBoss = lvl === 15 || lvl === 25 || lvl === 30 || lvl === 35 || lvl === 40;
                const isMiniBoss = lvl === 25 || lvl === 35;
                const stars = levelStats[lvl]?.stars || 0;

                return (
                  <div key={lvl} className={`relative rounded-2xl p-4 border transition-all duration-300 flex flex-col justify-between h-40 ${isUnlocked ? 'bg-slate-900/90 border-slate-700/50 hover:border-amber-500/50 shadow-lg hover:shadow-xl hover:scale-[1.03] cursor-pointer' : 'bg-slate-950/80 border-slate-900 opacity-40 cursor-not-allowed'}`} onClick={() => isUnlocked && startNewBattle(lvl)}>
                    <div className="flex justify-between items-start">
                      <span className={`text-xs font-black px-2 py-1 rounded-lg ${isUnlocked ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400'}`}>STAGE {lvl}</span>
                      {isBoss ? ( <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded-md font-bold animate-pulse">⚠️ BOSS</span> ) : isMiniBoss ? ( <span className="text-xs bg-orange-500/20 text-orange-300 border border-orange-500/40 px-2 py-0.5 rounded-md font-bold">☠️ MINI</span> ) : null}
                    </div>

                    <div className="my-2">
                      <h4 className="text-sm font-extrabold truncate text-slate-100">{isUnlocked ? LEVEL_NAMES[lvl] : "🔐 Dimensi Terkunci"}</h4>
                      <p className="text-[10px] text-slate-400 truncate">{isUnlocked ? "Tantangan 10 Pertanyaan" : "Selesaikan stage sebelumnya"}</p>
                    </div>

                    <div className="flex justify-between items-center border-t border-slate-800 pt-2">
                      {isUnlocked ? (
                        <div className="flex gap-1">
                          {[1, 2, 3].map((sIndex) => (<span key={sIndex} className={`text-sm ${sIndex <= stars ? 'text-amber-400' : 'text-slate-600'}`}>★</span>))}
                        </div>
                      ) : ( <span className="text-xs text-slate-600 flex items-center gap-1">🔒 Terkunci</span> )}
                      {isUnlocked && ( <span className="text-[10px] text-amber-400 font-extrabold group-hover:underline">TANTANG ➔</span> )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- HALAMAN 3: ARENA TANTANGAN (BATTLE ARENA) ---
  const Page3Game = () => {
    const handleAnswer = (selectedOption) => {
      if (gameStatus !== 'playing') return;
      const currentQ = questions[currentQIndex];
      const isCorrect = selectedOption === currentQ.answer;
      
      let nextScore = score;
      if (isCorrect) {
        nextScore = score + 1; setScore(nextScore); playSound('correct'); setEnemyHealth(h => Math.max(0, h - 10));
      } else {
        playSound('wrong'); triggerShake();
      }

      let nextHearts = hearts;
      if (!isCorrect) {
        nextHearts = hearts - 1; setHearts(nextHearts);
        if (nextHearts <= 0) { evaluateGameEnd(nextScore); return; }
      }

      if (currentQIndex < 9) {
        setCurrentQIndex(i => i + 1);
      } else {
        evaluateGameEnd(nextScore);
      }
    };

    const currentQ = questions[currentQIndex];
    const isBoss = activeLevel === 15 || activeLevel === 25 || activeLevel === 30 || activeLevel === 35 || activeLevel === 40;

    return (
      <div className={`min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-4 relative overflow-hidden ${isShake ? 'animate-shake' : ''}`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${activeRegion?.theme || 'from-slate-900 to-slate-950'} opacity-20 pointer-events-none`}></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.05),transparent_60%)] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-4xl">
          <div className="flex justify-between items-center mb-6 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl backdrop-blur-md">
            <div>
              <span className="text-xs font-bold text-amber-400 tracking-wider">STAGE {activeLevel} CHALLENGE</span>
              <h2 className="text-xl font-black">{LEVEL_NAMES[activeLevel]}</h2>
            </div>
            <button onClick={() => { setCurrentPage('REGION'); playSound('wrong'); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all">
              🏳️ Mundur & Batalkan Misi
            </button>
          </div>

          {gameStatus === 'playing' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-md flex flex-col justify-between">
                <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80 relative overflow-hidden">
                  {isBoss && ( <div className="absolute -top-5 -left-5 bg-red-600 text-white text-[9px] font-black uppercase py-6 px-12 rotate-[-45deg] tracking-wider animate-pulse pointer-events-none">BOSS BATTLE</div> )}
                  <div className="text-6xl mb-2 drop-shadow-lg transform hover:scale-110 transition-transform duration-300">{currentEnemy.emoji}</div>
                  <h4 className="text-lg font-black text-red-400">{currentEnemy.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 italic">{currentEnemy.desc}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-slate-400">BOSS HP</span>
                      <span className="text-red-400">{enemyHealth}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700 p-[1px]">
                      <div className="bg-gradient-to-r from-red-500 via-orange-500 to-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${enemyHealth}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="my-4 border-t border-slate-800/80"></div>

                <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
                  <div className="text-5xl mb-2">{hero.emoji}</div>
                  <h4 className="text-sm font-black text-emerald-400">{hero.name}</h4>
                  <div className="flex justify-center gap-1.5 mt-3">
                    {[1, 2, 3].map((heart) => (
                      <span key={heart} className={`text-2xl transition-all duration-300 transform ${heart <= hearts ? 'scale-110' : 'opacity-20 scale-90 grayscale'}`}>❤️</span>
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">Nyawa Tersisa</span>
                </div>
              </div>

              <div className="lg:col-span-8 flex flex-col gap-4">
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md flex justify-between items-center text-xs font-bold">
                  <span className="bg-blue-600/20 text-blue-300 border border-blue-500/40 px-3 py-1.5 rounded-lg">PERTANYAAN {currentQIndex + 1} / 10</span>
                  <span className="bg-green-600/20 text-green-300 border border-green-500/40 px-3 py-1.5 rounded-lg">SERANGAN BENAR: {score}</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-8 rounded-3xl backdrop-blur-md flex-grow flex flex-col justify-between relative overflow-hidden min-h-[350px]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                  <div className="text-center my-auto">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Pecahkan Kode Sihir Kuno</span>
                    <h3 className="text-3xl md:text-4xl font-extrabold tracking-wide text-white leading-relaxed select-none">{currentQ?.question}</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                    {currentQ?.options?.map((opt, i) => (
                      <button key={i} onClick={() => handleAnswer(opt)} className="group relative bg-slate-950/80 hover:bg-gradient-to-r hover:from-amber-500 hover:to-orange-500 hover:text-slate-950 text-slate-100 text-lg md:text-xl font-black p-5 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] border border-slate-800 hover:border-amber-400 shadow-md hover:shadow-lg flex items-center justify-between">
                        <span className="bg-slate-900 group-hover:bg-amber-600/30 text-xs w-8 h-8 rounded-lg flex items-center justify-center font-bold text-amber-400 group-hover:text-amber-950 border border-slate-800 group-hover:border-amber-500 transition-colors">{String.fromCharCode(65 + i)}</span>
                        <span className="flex-grow text-center">{opt}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">⚡</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/90 border border-slate-800 p-10 rounded-3xl shadow-2xl text-center backdrop-blur-md max-w-xl mx-auto relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
              <div className="text-8xl mb-6 animate-bounce">{gameStatus === 'won' ? '🏆' : '💀'}</div>
              <h2 className={`text-4xl font-black tracking-tight mb-2 ${gameStatus === 'won' ? 'text-green-400' : 'text-red-500'}`}>{gameStatus === 'won' ? 'MISI BERHASIL!' : 'BATTLE OVER!'}</h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">{gameStatus === 'won' ? "Selamat! Anda melumpuhkan monster penjaga sirkuit angka dan menyerap kekuatannya." : "Darah Anda habis karena sengatan salah perhitungan! Pulihkan energi dan bersiap untuk menyerang kembali."}</p>

              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 mb-8 max-w-sm mx-auto">
                <span className="text-xs text-slate-500 font-bold block mb-1">TOTAL SKOR AKURASI</span>
                <span className="text-3xl font-black text-white">{score} / 10 Soal Benar</span>
                {gameStatus === 'won' ? (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Hadiah Emas</span><span className="text-amber-400 font-black">+🪙 {score * 10} Emas</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-400">Bonus XP</span><span className="text-blue-400 font-black">+⭐ {score * 15} XP</span></div>
                  </div>
                ) : ( <p className="text-xs text-red-400/80 font-semibold mt-3">Skor kelulusan minimal: 7/10 benar</p> )}
              </div>

              <div className="flex justify-center gap-4">
                <button onClick={() => { setCurrentPage('REGION'); playSound('correct'); }} className="bg-slate-800 hover:bg-slate-700 text-slate-100 px-6 py-3.5 rounded-xl font-bold transition-all text-sm border border-slate-700">Kembali ke Peta</button>
                {gameStatus === 'won' ? (
                  <button onClick={() => { setCurrentPage('REGION'); playSound('correct'); }} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-6 py-3.5 rounded-xl font-black transition-all text-sm shadow-lg shadow-emerald-500/20">Buka Tahapan Selanjutnya ➔</button>
                ) : (
                  <button onClick={() => startNewBattle(activeLevel)} className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-slate-950 px-6 py-3.5 rounded-xl font-black transition-all text-sm shadow-lg shadow-red-500/20">Coba Lagi Battle ↺</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- TAMBAHAN: Logika Render Gerbang vs Game ---
  return (
    <React.Fragment>
      {!session ? (
        <Auth />
      ) : (
        <>
          {currentPage === 'MAP' && <Page1Map />}
          {currentPage === 'REGION' && <Page2Region />}
          {currentPage === 'GAME' && <Page3Game />}
        </>
      )}
    </React.Fragment>
  );
}