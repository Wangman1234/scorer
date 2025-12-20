import { type Country } from "./Country.ts";

export class Name {
  lastName: string;
  firstName: string;
  constructor(lastName: string, firstName: string);
  constructor(name: string);
  constructor(nameLastName: string, firstName: string = "") {
    if (firstName === "") {
      if (nameLastName.includes(",")) {
        let names = nameLastName.split(",");
        this.lastName = names[0]?.trim() ?? "";
        this.firstName = names[1]?.trim() ?? "";
      } else if (nameLastName.includes(".")) {
        let names = nameLastName.split(".");
        this.firstName = names[0]?.trim() ?? "";
        this.lastName = names[1]?.trim() ?? "";
      } else {
        let names = nameLastName.split(" ");
        if (names[0] === names[0]?.toUpperCase()) {
          this.lastName = names[0]?.trim() ?? "";
          this.firstName = names[1]?.trim() ?? "";
        } else {
          this.firstName = names[0]?.trim() ?? "";
          this.lastName = names[1]?.trim() ?? "";
        }
      }
    } else {
      this.lastName = nameLastName;
      this.firstName = firstName;
    }
  }
  toString(
    lastNameFirst = false,
    shortenFirst = false,
    shortenSecond = true,
    separator = " ",
    ending = "",
  ) {
    let first = this.firstName;
    let second = this.lastName;
    if (lastNameFirst) {
      first = this.lastName;
      second = this.firstName;
    }
    if (shortenFirst) {
      first = first[0] ?? "";
    }
    if (shortenSecond) {
      second = second[0] ?? "";
    }
    let name = first + separator + second + ending;
    if (name === separator + ending) {
      name = "";
    }
    return name;
  }
}

export class Fencer {
  id: string;
  name: Name;
  country: Country;
  club: string;
  constructor(id: string, name: Name, country: Country, club: string);
  constructor(id: string, name: string, country: Country, club: string);
  constructor(
    id: string,
    name: [string, string],
    country: Country,
    club: string,
  );
  constructor(id: string, name: string, country: Country, club: string);
  constructor();
  constructor(
    id: string = "",
    name: Name | string | [string, string] = "",
    country: Country = "",
    club: string = "",
  ) {
    if (name instanceof Name) {
      this.name = name;
    } else if (typeof name === "string") {
      this.name = new Name(name);
    } else {
      this.name = new Name(name[0], name[1]);
    }
    this.country = country;
    this.club = club;
    this.id = id;
  }
}

export const emptyFencer = new Fencer();

export type Status = {
  poultab: string;
  match: number | "";
  round: number | "";
  time: string;
  stopwatch: number | "";
  type: "I" | "T" | "";
  weapon: "F" | "E" | "S" | "";
  priority: "N" | "L" | "R" | "";
  state: "F" | "H" | "P" | "W" | "E" | "";
  doubles: number;
};

export type CorrectStatus = {
  poultab: string;
  match: number | "";
  round: number;
  time: string;
  stopwatch: number | "";
  type: "I" | "T" | "";
  weapon: "F" | "E" | "S";
  priority: "N" | "L" | "R";
  state: "F" | "H" | "P" | "W" | "E" | "";
  doubles: number;
};

export const emptyStatus: Status = {
  poultab: "",
  match: "",
  round: "",
  time: "",
  stopwatch: "",
  type: "",
  weapon: "",
  priority: "",
  state: "",
  doubles: 0,
};

export type FencerStatus = {
  fencer: Fencer;
  score: number | "";
  status: "U" | "V" | "D" | "A" | "E" | "";
  ycard: boolean | "";
  rcard: number | "";
  light: boolean | "";
  wlight: boolean | "";
  medical: number | "";
  reserve: "N" | "R" | "";
};

export type CorrectFencerStatus = {
  fencer: Fencer;
  score: number;
  status: "U" | "V" | "D" | "A" | "E";
  ycard: boolean;
  rcard: number;
  light: boolean;
  wlight: boolean;
  medical: number;
  reserve: "N" | "R" | "";
};

export const emptyFencerStatus: FencerStatus = {
  fencer: emptyFencer,
  score: "",
  status: "",
  ycard: "",
  rcard: "",
  light: "",
  wlight: "",
  medical: "",
  reserve: "",
};

export type keyMap = {
  Menu: string;
  AddMin: string;
  AddSec: string;
  MinusMin: string;
  MinusSec: string;
  LeftAdd1: string;
  RightAdd1: string;
  LeftAdd2: string;
  RightAdd2: string;
  LeftAdd3: string;
  RightAdd3: string;
  Double: string;
  MinusDouble: string;
  LeftMinus1: string;
  RightMinus1: string;
  LeftCard: string;
  RightCard: string;
  Timer: string;
  ResetTime: string;
  Period: string;
  Flip: string;
  [action: string]: string;
};
