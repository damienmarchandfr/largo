import { ObjectID } from 'mongodb'

import { LegatoErrorRelationOneToOneUpdate } from './RelationOneToOneUpdate.error'
import { LegatoEntity } from '../entity'
import { LegatoRelation } from '../decorators/relation.decorator'
import { errorCodes } from '.'

describe('RelationOneToOneUpdate error', () => {
	it('should be valid', () => {
		class RelationOneToOneUpdateClass extends LegatoEntity {
			@LegatoRelation({
				populatedKey: 'relation',
				targetType: RelationOneToOneUpdateClass,
			})
			relationId: ObjectID
			relation?: RelationOneToOneUpdateClass

			constructor() {
				super()
				// _id is set cause it's an update
				this._id = new ObjectID()
				// Value set
				this.relationId = new ObjectID()
			}
		}

		const obj = new RelationOneToOneUpdateClass()

		const error = new LegatoErrorRelationOneToOneUpdate(obj, 'relationId')

		expect(error.code).toEqual(errorCodes.RELATION_ONE_TO_ONE_UPDATE)
		expect(error.type).toEqual('RELATION_ONE_TO_ONE_UPDATE')
		expect(error.message).toEqual(
			`You set RelationOneToOneUpdateClass.relationId : ${obj.relationId} for object with _id : ${obj._id}. This target does not exist.`
		)
	})
})
