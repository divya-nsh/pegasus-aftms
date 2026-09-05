const IS_24_HOUR_TIME_FORMAT = true
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const TIME_FORMAT = IS_24_HOUR_TIME_FORMAT ? 'HH:mm' : 'h:mm a'
const DATE_FORMAT = 'dd-MMM-yyyy'
const WEEKDAY_FORMAT = 'EEE'

export { IS_24_HOUR_TIME_FORMAT, TIME_FORMAT, DATE_FORMAT, WEEKDAY_FORMAT }
