import {type Country} from "./Country.ts";

export class Name {
    lastName: string;
    firstName: string;
    constructor(lastName: string, firstName: string)
    constructor(name: string)
    constructor(nameLastName: string, firstName: string = "") {
        if (firstName === "") {
            if (nameLastName.includes(",")) {
                let names = nameLastName.split(",")
                this.lastName = names[0]?.trim() ?? ""
                this.firstName = names[1]?.trim() ?? ""
            } else if (nameLastName.includes(".")) {
                let names = nameLastName.split(".")
                this.firstName = names[0]?.trim() ?? ""
                this.lastName = names[1]?.trim() ?? ""
            } else {
                let names = nameLastName.split(" ")
                this.firstName = names[0]?.trim() ?? ""
                this.lastName = names[1]?.trim() ?? ""
            }
        } else {
            this.lastName = nameLastName
            this.firstName = firstName
        }
        console.log(this)
    }
    toString(lastNameFirst = false, shortenFirst = false, shortenSecond = true, separator = " ", ending = "") {
        let first = this.firstName
        let second = this.lastName
        if (lastNameFirst) {
            first = this.lastName
            second = this.firstName
        }
        if (shortenFirst) {
            first = first[0] ?? ""
        }
        if (shortenSecond) {
            second = second[0] ?? ""
        }
        let name = first + separator + second + ending
        if (name === separator + ending) {
            name = ""
        }
        return name
    }
}

export class Fencer {
    id: string;
    name: Name;
    country: Country;
    club: string;
    constructor(id: string, name: Name, country: Country, club: string)
    constructor(id: string, name: string, country: Country, club: string)
    constructor(id: string, name: [string, string], country: Country, club: string)
    constructor(id: string, name: string, country: Country, club: string)
    constructor(id: string, name: Name | string | [string, string], country: Country, club: string) {
        if ( name instanceof Name) {
            this.name = name;
        } else if (typeof name === "string") {
            this.name = new Name(name)
        } else {
            this.name = new Name(name[0], name[1])
        }
        this.country = country
        this.club = club
        this.id = id
    }
}

export const emptyFencer = new Fencer("", "", "", "");

export type Status = {
    pooltab: string
    match: number | ""
    round: number | ""
    time: string
    stopwatch: number | ""
    type: "I" | "T" | ""
    weapon: "F" | "E" | "S" | ""
    priority: "N" | "L" | "R" | ""
    state: "F" | "H" | "P" | "W" | "E" | ""
}

export type CorrectStatus = {
    pooltab: string
    match: number
    round: number
    time: string
    stopwatch: number
    type: "I" | "T"
    weapon: "F" | "E" | "S"
    priority: "N" | "L" | "R"
    state: "F" | "H" | "P" | "W" | "E"
}

export const emptyStatus: Status = {
    pooltab: "",
    match: "",
    round: "",
    time: "",
    stopwatch: "",
    type: "",
    weapon: "",
    priority: "",
    state: "",
}

export type FencerStatus = {
    fencer: Fencer
    score: number | ""
    status: "U" | "V" | "D" | "A" | "E" | ""
    ycard: boolean | ""
    rcard: number | ""
    light: boolean | ""
    wlight: boolean | ""
    medical: number | ""
    reserve: "N" | "R" | ""
}

export type CorrectFencerStatus = {
    fencer: Fencer
    score: number
    status: "U" | "V" | "D" | "A" | "E"
    ycard: boolean
    rcard: number
    light: boolean
    wlight: boolean
    medical: number
    reserve: "N" | "R"
}

export const emptyFencerStatus: FencerStatus = {
    fencer: emptyFencer,
    score: "",
    status: "",
    ycard: "",
    rcard: "",
    light: "",
    wlight: "",
    medical: "",
    reserve: ""
}

export function toSeconds(time?: string) {
    const time1 = time ?? ""
    if (time1 === "") {
        return ""
    }
    const split = time1.split(":")
    return Number(split[0]) * 60 + Number(split[1]);
}

export function toTime(seconds: number | "") {
    if (seconds === "") {
        return ""
    }
    const minutes = Math.floor(seconds / 60)
    const minsec = seconds - minutes * 60
    let sec = minsec.toString()
    if (minutes < 10) {
        sec = "0" + minsec
    }
    return minutes.toString() + ":" + sec;
}

export function cyrConvert<T, R>(convert: (pre: T) => R, pre?: T | ""): R | "" {
    const pre1 = pre ?? ""

    if (pre1 === "") {
        return ""
    }
    return convert(pre1)
}

export function App() {
    document.addEventListener("keydown", function (event) {
        console.log(event)
    })
}
