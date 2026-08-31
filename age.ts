// // Helpers
// const isLeapYear = (year: number) => {
//   return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
// };

// const monthDays = (year: number, month: number) => {
//   if (month === 1) {
//     return isLeapYear(year) ? 29 : 28;
//   }
//   if ([3, 5, 8, 10].includes(month)) {
//     return 30;
//   }
//   return 31;
// };

// // Without considering time and year part
// const isDateOccured = (date: Date) => {
//   const now = new Date();
//   //curr is 8 and target is 11
//   if (now.getMonth() === date.getMonth()) {
//     return now.getDate() < date.getDate() ? false : true;
//   }

//   return now.getMonth() < date.getMonth() ? false : true;
// };

// //

// const mydob = new Date("2002-11-16");

// const now = new Date("2026-08-26");

// let isBirthdayHappened = isDateOccured(mydob);

// const year = isBirthdayHappened ? mydob
