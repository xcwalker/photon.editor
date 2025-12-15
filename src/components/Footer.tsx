import css from "../styles/components/footer.module.css";
import { Logos } from "./Logo";
import Socials from "./Socials";
import build from "../../version.json";

export default function Footer() {
  const buildDate = new Date(build.BUILD_DATE);
  const mode = import.meta.env.MODE;

  const productionBuildString =
    buildDate.getFullYear().toString().substr(-2) +
    "W" +
    pad(getWeekNumber(buildDate), 2) +
    getIterationAlphabet(build.APP_VERSION);

  const firstProdBuildDate = new Date("2025-12-15T18:15:10.611Z");

  return (
    <footer className={css.footer}>
      <Socials />
      <div className={css.container}>
        <div className={css.column}>
          <Logos.xcwalkeruk className={css.logo} />
          <span className={css.span}>
            Built and maintained by{" "}
            <a href="https://xcwalker.dev">xcwalker.dev</a>
          </span>
          <span className={css.span}>
            Copyright ©{" "}
            {firstProdBuildDate.getFullYear() === buildDate.getFullYear()
              ? ""
              : firstProdBuildDate.getFullYear() + " - "}
            {buildDate.getFullYear()} xcwalker.
          </span>
          <span className={css.span}>All rights reserved.</span>
        </div>

        <div className={css.column}>
          {mode === "development" && (
            <div className={css.devMode}>
              <span>Development Build </span>
              <span className={css.devBuild}>
                Development Version {build.DEV_VERSION}
              </span>
              <span className={css.prodBuild}>
                of prod. build {productionBuildString}
              </span>
              <span>Confidential - Do Not Distribute</span>
            </div>
          )}
          {mode !== "development" && (
            <span className={css.build}>
              Production Build {productionBuildString}
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}

function getWeekNumber(date: Date) {
  // Copy date so don't modify original
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  // Return week number
  return weekNo;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pad(num: any, size: number) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
}

const alphabet = [...Array(26)].map((_, i) => String.fromCharCode(i + 65));

function getIterationAlphabet(n: number): string {
  let result = "";
  const len = alphabet.length;

  if (n === -1) {
    return alphabet[0];
  }

  do {
    result = alphabet[n % len] + result;
    n = Math.floor(n / len) - 1;
  } while (n >= 0);

  return result;
}
