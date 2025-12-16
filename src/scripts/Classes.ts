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
                // @ts-ignore
                this.lastName = names[0].trim()
                // @ts-ignore
                this.firstName = names[1].trim()
            } else {
                let names = nameLastName.split(" ")
                // @ts-ignore
                this.firstName = names[0].trim()
                // @ts-ignore
                this.lastName = names[names.length - 1].trim()
            }
        } else {
            this.lastName = nameLastName
            this.firstName = firstName
        }
    }
    toString(lastNameFirst = true, shorten = false) {
        let name: string
        if (lastNameFirst) {
            if (shorten) {
                name = this.lastName + ", " + this.firstName[0]
            } else {
                name = this.lastName + ", " + this.firstName
            }
        } else {
            if (shorten) {
                name = this.firstName + " " + this.lastName[0]
            } else {
                name = this.firstName + " " + this.lastName
            }
        }
        return name
    }
}

export class Fencer {
    name: Name;
    country: Country;
    club: string;
    id: number;
    constructor(id: number, name: Name, country: Country, club: string)
    constructor(id: number, name: string, country: Country, club: string)
    constructor(id: number, name: [string, string], country: Country, club: string)
    constructor(id: number, name: Name | string | [string, string], country: Country, club: string) {
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

export function App() {
    document.addEventListener("keydown", function (event) {
        console.log(event)
    })
}
