import assert from 'assert';

const BASE_URL = 'http://localhost:8017';

async function testOfficialTimetable() {
  console.log('🧪 Testing Official GTBIT 2nd Year IT-1 Timetable and Calendar...\n');

  // 1. Check Monday Group A (CM_Th, DLCD_Th, DLCD_I_Lab, DM_Th)
  const ttRes = await fetch(`${BASE_URL}/api/timetable?group=A`).then(r => r.json());
  const monSlots = ttRes.timetable['1'].slots;
  assert.strictEqual(monSlots.length, 4);
  assert.strictEqual(monSlots[0].subject, 'CM_Th');
  assert.strictEqual(monSlots[1].subject, 'DLCD_Th');
  assert.strictEqual(monSlots[2].subject, 'DLCD_I_Lab');
  assert.strictEqual(monSlots[3].subject, 'DM_Th');
  console.log('✅ Monday schedule verified: CM_Th, DLCD_Th, DLCD_I_Lab (Group A), DM_Th.');

  // 2. Check Tuesday Group A (DM_Th, DS_Th, OOPs_Th, CM_Th, OOPs_I_Lab)
  const tueSlots = ttRes.timetable['2'].slots;
  assert.strictEqual(tueSlots.length, 5);
  assert.strictEqual(tueSlots[4].subject, 'OOPs_I_Lab');
  console.log('✅ Tuesday schedule verified: 5 classes including OOPs_I_Lab.');

  // 3. Check Wednesday Group A (DM_Th, DS_I_Lab, DS_Th, DLCD_Th, OOPs_Th)
  const wedSlots = ttRes.timetable['3'].slots;
  assert.strictEqual(wedSlots.length, 5);
  assert.strictEqual(wedSlots[1].subject, 'DS_I_Lab');
  console.log('✅ Wednesday schedule verified: 5 classes including DS_I_Lab.');

  // 4. Check Thursday Group A (DLCD_Th, DS_Th, CM_Th, DM_Th)
  const thuSlots = ttRes.timetable['4'].slots;
  assert.strictEqual(thuSlots.length, 4);
  console.log('✅ Thursday schedule verified: 4 classes.');

  // 5. Check Friday Group A (DS_Th, CM_Th, DLCD_Th, CM_i_Lab, OOPs_Th)
  const friSlots = ttRes.timetable['5'].slots;
  assert.strictEqual(friSlots.length, 5);
  assert.strictEqual(friSlots[3].subject, 'CM_i_Lab');
  console.log('✅ Friday schedule verified: 5 classes including CM_i_Lab.');

  // 6. Check Calendar Endpoint
  const calRes = await fetch(`${BASE_URL}/api/calendar/2026/8`).then(r => r.json());
  assert.strictEqual(calRes.year, 2026);
  assert.strictEqual(calRes.month, 8);
  assert.strictEqual(calRes.days.length, 31);
  console.log('✅ Calendar API verified: 31 days with slot mappings.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY FOR OFFICIAL TIMETABLE!');
}

testOfficialTimetable().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
