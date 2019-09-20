import { MongODMEntity } from '../../src/entity'
import { MongODMField } from '../../src/decorators/field.decorator'
import { MongODMRelation } from '../../src/decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { User } from '../data'
import { JobODM } from './Job.odm'
import { HobbyODM } from './Hobby.odm'

export class UserODM extends MongODMEntity {
	@MongODMField()
	firstname: string

	@MongODMField()
	lastname: string

	@MongODMRelation({
		populatedKey: 'jobs',
		targetType: JobODM,
	})
	jobsIds: ObjectID[] = []
	jobs?: JobODM[]

	@MongODMRelation({
		populatedKey: 'hobbies',
		targetType: HobbyODM,
	})
	hobbiesIds: ObjectID[] = []
	hobbies?: HobbyODM[]

	constructor() {
		super()
		const user = new User()
		this.firstname = user.firstname
		this.lastname = user.lastname
	}
}
