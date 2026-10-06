const SESSION_COOKIE_NAME = "sid";
const SCHEDULE_NUMBER_PREFIX = "SCH-";

const IS_PACKAGED = !!(process as any).pkg;

export { SESSION_COOKIE_NAME, SCHEDULE_NUMBER_PREFIX, IS_PACKAGED };
