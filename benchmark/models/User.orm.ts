import { MongORMEntity } from '../../src/entity'
import { MongORMField } from '../../src/decorators/field.decorator'
import { MongORMRelation } from '../../src/decorators/relation.decorator'
import { ObjectID } from 'mongodb'
import { User } from '../data'
import { JobORM } from './Job.orm'
import { HobbyORM } from './Hobby.orm'

export class UserORM extends MongORMEntity {
	@MongORMField()
	firstname: string

	@MongORMField()
	lastname: string

	@MongORMRelation({
		populatedKey: 'jobs',
		targetType: JobORM,
	})
	jobsIds: ObjectID[] = []
	jobs?: JobORM[]

	@MongORMRelation({
		populatedKey: 'hobbies',
		targetType: HobbyORM,
	})
	hobbiesIds: ObjectID[] = []
	hobbies?: HobbyORM[]

	constructor() {
		super()
		const user = new User()
		this.firstname = user.firstname
		this.lastname = user.lastname
	}
}
