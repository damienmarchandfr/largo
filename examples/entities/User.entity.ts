import { LegatoEntity } from '../../src/entity'
import { ObjectID } from 'mongodb'
import { LegatoField } from '../../src/decorators/field.decorator'
import { LegatoIndex } from '../../src/decorators/index.decorator'
import { LegatoRelation } from '../../src/decorators/relation.decorator'
import { Job } from './Job.entity'

export class User extends LegatoEntity {
	@LegatoIndex({
		unique: true,
	})
	email: string = new ObjectID().toHexString() + '@legato.com'

	@LegatoField()
	username: string = new ObjectID().toHexString()

	@LegatoField()
	password: string = new ObjectID().toHexString()

	// Relations

	// One to one
	@LegatoRelation({
		populatedKey: 'job',
		targetType: Job,
		checkRelation: true,
	})
	jobId: ObjectID | null = null

	// One to many
	@LegatoRelation({
		populatedKey: 'friends',
		targetType: User,
		checkRelation: true,
	})
	friendIds: ObjectID[] = []

	setJob(jobId: ObjectID) {
		this.jobId = jobId
	}

	addFriend(friendId: ObjectID) {
		this.friendIds.push(friendId)
	}
}
