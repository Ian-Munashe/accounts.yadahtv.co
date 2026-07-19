import { addMinutes } from "date-fns";

import { countries } from "@/countries";
import { phoneCodes } from "@/phone-codes";

export class Utils {
  [x: string]: any;
  static instance = new Utils();

  getValueByPath = (object: any, path: string) =>
    path?.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), object);

  /**
   * Returns an ISO 8601 datetime string representing a time offset in the future.
   *
   * Parses a string representing a time duration (e.g., "30m", "2h", "1d", "15s")
   * and adds that amount to the current date/time, returning the resulting date as an ISO string.
   *
   * Supported suffixes:
   *   - "s" for seconds (e.g., "90s")
   *   - "m" for minutes (e.g., "45m")
   *   - "h" for hours   (e.g., "2h")
   *   - "d" for days    (e.g., "3d")
   *
   * @param time - Duration string with a number and supported suffix.
   * @returns The future date as an ISO string.
   *
   * @example
   *   Utils.instance.futureDateTime("10m");
   *   // Returns ISO string of 10 minutes from now
   *
   *   Utils.instance.futureDateTime("2h");
   *   // Returns ISO string of 2 hours from now
   */
  futureDateTime = (time: string): string => {
    let minutes = 0;
    if (time.includes("s")) {
      minutes = Number(time.split("s")[0]) / 60;
    } else if (time.includes("m")) {
      minutes = Number(time.split("m")[0]);
    } else if (time.includes("h")) {
      minutes = Number(time.split("h")[0]) * 60;
    } else if (time.includes("d")) {
      minutes = Number(time.split("d")[0]) * 60 * 24;
    }
    const future = addMinutes(new Date(), minutes);
    return future.toISOString();
  };

  /**
   * Converts a country code to its full country name (label) using the countries list.
   *
   * @param code - The ISO country code or dialing code to look up (e.g., "US", "+1").
   * @returns The corresponding country label if found, or returns the input code if not found.
   *
   * @example
   *   Utils.instance.countryCodeToName("US"); // "United States"
   *   Utils.instance.countryCodeToName("+41"); // "Switzerland"
   *   Utils.instance.countryCodeToName(""); // ""
   */
  countryCodeToName = (code: string): string => {
    if (!code) return "";
    const country = countries.find((c) => c.value === code.toUpperCase());
    return country ? country.label : code;
  };

  /**
   * Capitalizes the first letter of each word in a string.
   *
   * Converts the first character of every word in the input string to uppercase,
   * leaving other characters unchanged.
   *
   * @param str - The input string to capitalize.
   * @returns The input string with each word capitalized.
   *
   * @example
   *   Utils.instance.capitalize("hello world"); // "Hello World"
   *   Utils.instance.capitalize("the quick brown fox"); // "The Quick Brown Fox"
   *   Utils.instance.capitalize(""); // ""
   */
  capitalize(str: string): string {
    if (!str) return "";
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  /**
   * Removes the international dialing code from a given phone number.
   *
   * This function attempts to strip the country/region code (as listed in `phoneCodes`)
   * from the beginning of the provided phone number string, returning only the local
   * or remainder number. If a match is not found, the phone number is returned as-is.
   *
   * Example:
   *   getStrippedPhoneNumber("+11234567890") // "1234567890"
   *   getStrippedPhoneNumber("441234567890") // "1234567890" (if "44" is in codes)
   *   getStrippedPhoneNumber("12345")        // "12345"
   *
   * @param phone - The phone number string, possibly including an international dialing code.
   * @returns The phone number string with the dialing code (if found) removed; returns an empty string if input is falsy.
   */
  getStrippedPhoneNumber = (phone?: string): string => {
    if (!phone) return "";
    const codes = phoneCodes
      .map((pc) => (pc.value.startsWith("+") ? pc.value.substring(1) : pc.value))
      .sort((a, b) => b.length - a.length);

    const matched = codes.find((code) => phone.startsWith(code));
    if (matched) {
      return phone.slice(matched.length).replace(/^\-/, "");
    }
    return phone;
  };

  /**
   * Converts a value (or array of values) to their corresponding label(s) using a provided options list.
   * If a value is not found, returns undefined for that value.
   *
   * @param value - A single value or an array of values to find labels for.
   * @param options - An array of objects with { label, value } pairs.
   * @returns The corresponding label, or array of labels (order matches input).
   */
  valueToLabel = (value: string | string[] | undefined, options: ISelectOption[]): string | string[] => {
    if (value === undefined) return "";
    if (Array.isArray(value)) {
      return value.map((v: string) => {
        const found = options.find((opt: ISelectOption) => opt.value === v);
        return found ? found.label : v;
      });
    }
    const found = options.find((opt: ISelectOption) => opt.value === value);
    return found ? found.label : (value ?? "");
  };

  /**
   * Converts an ISO date string to seconds from now.
   *
   * @param isoString - An ISO 8601 date string (e.g., from futureDateTime).
   * @returns The number of seconds from now until that date.
   *
   * @example
   *   Utils.instance.toSeconds(Utils.instance.futureDateTime("90d")); // 7776000
   *   Utils.instance.toSeconds(Utils.instance.futureDateTime("2h"));  // 7200
   */
  toSeconds = (isoString: string): number => {
    const futureDate = new Date(isoString);
    const now = new Date();
    return Math.floor((futureDate.getTime() - now.getTime()) / 1000);
  };
}
