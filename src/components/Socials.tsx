import { Fragment } from "react/jsx-runtime";
import SocialBackground, { SocialIcon } from "./SocialIcon";
import css from "../styles/components/socials.module.css";
import { Link } from "react-router-dom";

export default function Socials() {
  return (
    <div className={css.container}>
      <SocialsList />
    </div>
  );
}

export function SocialsList(props: {
  listClassName?: string;
  buttonClassName?: string;
  iconClassName?: string;
  externalClassName?: string;
  contentClassName?: string;
  textClassName?: string;
}) {
  return (
    <ul className={props.listClassName ? props.listClassName : css.list}>
      {array.map((item, index) => {
        return (
          <Fragment key={index}>
            <Link
              to={item.url}
              title={item.icon}
              className={props.buttonClassName ? "" : css.social}
            >
              <SocialIcon social={item.icon} className={props.iconClassName} />
              <SocialBackground social={item.icon} />
            </Link>
          </Fragment>
        );
      })}
    </ul>
  );
}

const array = [
  {
    icon: "Twitter",
    url: "http://www.twitter.com/xc_walker",
  },
  {
    icon: "Instagram",
    url: "https://instagram.com/xc_walker/",
  },
  {
    icon: "Youtube",
    url: "https://www.youtube.com/@xcwalker",
  },
  {
    icon: "Discord",
    url: "https://discordapp.com/users/358316209252597761",
  },
  {
    icon: "Twitch",
    url: "https://www.twitch.tv/xc_walker",
  },
  {
    icon: "TikTok",
    url: "https://www.tiktok.com/@xc_walker",
  },
];
