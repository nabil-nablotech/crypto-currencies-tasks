import { ErrorNameType } from './message'

export class CustomError extends Error {
    name: ErrorNameType
    isNonFatal: Boolean

    constructor(msg: string, name: ErrorNameType, isNonFatal: boolean = false ) {
        super(msg);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, CustomError.prototype);

        this.name = name
        this.isNonFatal = isNonFatal
    }

    getErrorName(): ErrorNameType {
        return this.name
    }
}