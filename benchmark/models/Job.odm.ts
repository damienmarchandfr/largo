import { MongODMEntity } from '../../src/entity'
import { MongODMField } from '../../src/decorators/field.decorator'
import { MongODMRelation } from '../../src/decorators/relation.decorator'
import { UserODM } from './User.odm'
import { ObjectID } from 'mongodb'
import { Job } from '../data'

export class JobODM extends MongODMEntity {
	@MongODMField()
	name: string

	@MongODMField()
	years: number

	@MongODMField()
	description: string

	@MongODMField()
	companyName: string

	@MongODMField()
	numberOfEmployes: number

	@MongODMRelation({
		populatedKey: 'employees',
		targetType: UserODM,
	})
	employesIds: ObjectID[] = []
	employees?: UserODM[]

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
