import { MongODMEntity } from '../../src/entity'
import { MongODMField } from '../../src/decorators/field.decorator'
import { Hobby } from '../data'

export class HobbyODM extends MongODMEntity {
	@MongODMField()
	name: string

	@MongODMField()
	from: Date

	@MongODMField()
	to: Date

	@MongODMField()
	level: number

	constructor() {
		super()
		const hobby = new Hobby()
		this.name = hobby.name
		this.from = hobby.from
		this.to = hobby.to
		this.level = hobby.level
	}
}
