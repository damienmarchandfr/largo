import { MongORMEntity } from '../../src/entity'
import { MongORMField } from '../../src/decorators/field.decorator'
import { MongORMRelation } from '../../src/decorators/relation.decorator'
import { UserORM } from './User.orm'
import { ObjectID } from 'mongodb'
import { Job } from '../data'

export class JobORM extends MongORMEntity {
	@MongORMField()
	name: string

	@MongORMField()
	years: number

	@MongORMField()
	description: string

	@MongORMField()
	companyName: string

	@MongORMField()
	numberOfEmployes: number

	@MongORMRelation({
		populatedKey: 'employees',
		targetType: UserORM,
	})
	employesIds: ObjectID[] = []
	employees?: UserORM[]

	constructor() {
		super()
		const job = new Job()
		this.name = job.name
		this.years = job.years
		this.companyName = job.companyName
		this.description = job.description
		this.numberOfEmployes = job.numberOfEmployes
	}
}
