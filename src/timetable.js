export const SUBJECTS_META = {
  CM_Th: {
    code: 'CM_Th',
    name: 'Computational Methods (Theory)',
    teacher: 'Ms. Seema (App.)',
    room: 'LEC_11',
    type: 'theory',
    color: '#3b82f6' // Blue
  },
  DLCD_Th: {
    code: 'DLCD_Th',
    name: 'Digital Logic & Circuit Design (Theory)',
    teacher: 'Mr. Gurmeet Singh',
    room: 'LEC_11',
    type: 'theory',
    color: '#8b5cf6' // Purple
  },
  DM_Th: {
    code: 'DM_Th',
    name: 'Discrete Mathematics (Theory)',
    teacher: 'Mr. Navjot Singh',
    room: 'LEC_11',
    type: 'theory',
    color: '#ec4899' // Pink
  },
  DS_Th: {
    code: 'DS_Th',
    name: 'Data Structures (Theory)',
    teacher: 'Ms. Debleena',
    room: 'LEC_11',
    type: 'theory',
    color: '#10b981' // Emerald
  },
  OOPs_Th: {
    code: 'OOPs_Th',
    name: 'Object Oriented Programming (Theory)',
    teacher: 'Dr. P.S. Bedi',
    room: 'LEC_11',
    type: 'theory',
    color: '#f59e0b' // Amber
  },
  DLCD_I_Lab: {
    code: 'DLCD_I_Lab',
    name: 'DLCD Lab',
    teacher: 'Mr. Gurmeet Singh',
    room: 'LAB_2',
    type: 'lab',
    color: '#a855f7' // Violet
  },
  DS_I_Lab: {
    code: 'DS_I_Lab',
    name: 'Data Structures Lab',
    teacher: 'Ms. Debleena',
    room: 'LAB_12',
    type: 'lab',
    color: '#06b6d4' // Cyan
  },
  OOPs_I_Lab: {
    code: 'OOPs_I_Lab',
    name: 'OOPs Lab',
    teacher: 'Dr. P.S. Bedi',
    room: 'LAB_11',
    type: 'lab',
    color: '#f97316' // Orange
  },
  CM_i_Lab: {
    code: 'CM_i_Lab',
    name: 'Computational Methods Lab',
    teacher: 'MATHS_FAC2',
    room: 'LAB_13 / Computer Centre',
    type: 'lab',
    color: '#14b8a6' // Teal
  }
};

export const WEEKLY_TIMETABLE = {
  // Monday = 1
  1: {
    name: 'Monday',
    slots: [
      {
        id: 'mon_10_11',
        time: '10:00 - 11:00',
        subject: 'CM_Th',
        teacher: 'Ms. Seema (App.)',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'mon_11_12',
        time: '11:00 - 12:00',
        subject: 'DLCD_Th',
        teacher: 'Mr. Gurmeet Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'mon_1230_1430_A',
        time: '12:30 - 02:30',
        subject: 'DLCD_I_Lab',
        teacher: 'Mr. Gurmeet Singh',
        room: 'LAB_2',
        type: 'lab',
        group: 'A',
        units: 1
      },
      {
        id: 'mon_1230_1430_B',
        time: '12:30 - 02:30',
        subject: 'DS_I_Lab',
        teacher: 'Ms. Debleena',
        room: 'LAB_12',
        type: 'lab',
        group: 'B',
        units: 1
      },
      {
        id: 'mon_1430_1530',
        time: '02:30 - 03:30',
        subject: 'DM_Th',
        teacher: 'Mr. Navjot Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      }
    ]
  },
  // Tuesday = 2
  2: {
    name: 'Tuesday',
    slots: [
      {
        id: 'tue_09_10',
        time: '09:00 - 10:00',
        subject: 'DM_Th',
        teacher: 'Mr. Navjot Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'tue_10_11',
        time: '10:00 - 11:00',
        subject: 'DS_Th',
        teacher: 'Ms. Debleena',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'tue_11_12',
        time: '11:00 - 12:00',
        subject: 'OOPs_Th',
        teacher: 'Dr. P.S. Bedi',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'tue_1230_1330',
        time: '12:30 - 01:30',
        subject: 'CM_Th',
        teacher: 'Ms. Seema (App.)',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'tue_1330_1530_A',
        time: '01:30 - 03:30',
        subject: 'OOPs_I_Lab',
        teacher: 'Dr. P.S. Bedi',
        room: 'LAB_11',
        type: 'lab',
        group: 'A',
        units: 1
      }
    ]
  },
  // Wednesday = 3
  3: {
    name: 'Wednesday',
    slots: [
      {
        id: 'wed_09_10',
        time: '09:00 - 10:00',
        subject: 'DM_Th',
        teacher: 'Mr. Navjot Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'wed_10_12_A',
        time: '10:00 - 12:00',
        subject: 'DS_I_Lab',
        teacher: 'Ms. Debleena',
        room: 'LAB_12',
        type: 'lab',
        group: 'A',
        units: 1
      },
      {
        id: 'wed_10_12_B',
        time: '10:00 - 12:00',
        subject: 'CM_i_Lab',
        teacher: 'MATHS_FAC2',
        room: 'Computer Centre',
        type: 'lab',
        group: 'B',
        units: 1
      },
      {
        id: 'wed_1230_1330',
        time: '12:30 - 01:30',
        subject: 'DS_Th',
        teacher: 'Ms. Debleena',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'wed_1330_1430',
        time: '01:30 - 02:30',
        subject: 'DLCD_Th',
        teacher: 'Mr. Gurmeet Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'wed_1430_1530',
        time: '02:30 - 03:30',
        subject: 'OOPs_Th',
        teacher: 'Dr. P.S. Bedi',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      }
    ]
  },
  // Thursday = 4
  4: {
    name: 'Thursday',
    slots: [
      {
        id: 'thu_09_10',
        time: '09:00 - 10:00',
        subject: 'DLCD_Th',
        teacher: 'Mr. Gurmeet Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'thu_10_11',
        time: '10:00 - 11:00',
        subject: 'DS_Th',
        teacher: 'Ms. Debleena',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'thu_11_12',
        time: '11:00 - 12:00',
        subject: 'CM_Th',
        teacher: 'Ms. Seema (App.)',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'thu_1230_1330',
        time: '12:30 - 01:30',
        subject: 'DM_Th',
        teacher: 'Mr. Navjot Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'thu_1330_1530_B',
        time: '01:30 - 03:30',
        subject: 'DLCD_I_Lab',
        teacher: 'Mr. Gurmeet Singh',
        room: 'LAB_2',
        type: 'lab',
        group: 'B',
        units: 1
      }
    ]
  },
  // Friday = 5
  5: {
    name: 'Friday',
    slots: [
      {
        id: 'fri_09_10',
        time: '09:00 - 10:00',
        subject: 'DS_Th',
        teacher: 'Ms. Debleena',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'fri_10_11',
        time: '10:00 - 11:00',
        subject: 'CM_Th',
        teacher: 'Ms. Seema (App.)',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'fri_11_12',
        time: '11:00 - 12:00',
        subject: 'DLCD_Th',
        teacher: 'Mr. Gurmeet Singh',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      },
      {
        id: 'fri_1230_1430_A',
        time: '12:30 - 02:30',
        subject: 'CM_i_Lab',
        teacher: 'MATHS_FAC2',
        room: 'LAB_13',
        type: 'lab',
        group: 'A',
        units: 1
      },
      {
        id: 'fri_1230_1430_B',
        time: '12:30 - 02:30',
        subject: 'OOPs_I_Lab',
        teacher: 'Dr. P.S. Bedi',
        room: 'LAB_11',
        type: 'lab',
        group: 'B',
        units: 1
      },
      {
        id: 'fri_1430_1530',
        time: '02:30 - 03:30',
        subject: 'OOPs_Th',
        teacher: 'Dr. P.S. Bedi',
        room: 'LEC_11',
        type: 'theory',
        group: 'ALL',
        units: 1
      }
    ]
  },
  // Saturday = 6
  6: {
    name: 'Saturday',
    slots: []
  },
  // Sunday = 0
  0: {
    name: 'Sunday',
    slots: []
  }
};

/**
 * Filter slots for a given day and student group (default 'A')
 */
export function getScheduleForDay(dayOfWeek, group = 'A') {
  const dayData = WEEKLY_TIMETABLE[dayOfWeek] || { name: 'Unknown', slots: [] };
  const filteredSlots = dayData.slots.filter(
    (slot) => slot.group === 'ALL' || slot.group === group
  );
  return {
    dayOfWeek,
    dayName: dayData.name,
    slots: filteredSlots
  };
}

/**
 * Get weekly subject frequency for a group
 */
export function getWeeklySubjectCounts(group = 'A') {
  const counts = {};
  for (const subjectCode of Object.keys(SUBJECTS_META)) {
    counts[subjectCode] = 0;
  }
  for (let day = 1; day <= 5; day++) {
    const daySchedule = getScheduleForDay(day, group);
    for (const slot of daySchedule.slots) {
      if (counts[slot.subject] !== undefined) {
        counts[slot.subject] += 1;
      }
    }
  }
  return counts;
}
