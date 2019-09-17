import { MongORMEntity } from '../../src/entity'
import { MongORMField } from '../../src/decorators/field.decorator'
import { Hobby } from '../data'

export class HobbyORM extends MongORMEntity {
	@MongORMField()
	name: string

	@MongORMField()
	from: Date

	@MongORMField()
	to: Date

	@MongORMField()
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
