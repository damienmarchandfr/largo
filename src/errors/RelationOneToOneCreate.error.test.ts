import { LegatoErrorRelationOneToOneCreate } from './RelationOneToOneCreate.error'
import { ObjectID } from 'mongodb'
import { LegatoEntity } from '../entity'
import { LegatoRelation } from '../decorators/relation.decorator'
import { EPERM } from 'constants'
import { errorCodes } from '.'

describe('RelationOneToOneCreate error', () => {
	it('should be valid', () => {
		class LegatoErrorRelationOneToOneCreateClass extends LegatoEntity {
			@LegatoRelation({
				populatedKey: 'relation',
				targetType: LegatoErrorRelationOneToOneCreateClass,
			})
			relationId: ObjectID
			relation?: LegatoErrorRelationOneToOneCreate

			constructor() {
				super()
				this.relationId = new ObjectID()
			}
		}

		const obj = new LegatoErrorRelationOneToOneCreateClass()

		const error = new LegatoErrorRelationOneToOneCreate(obj, 'relationId')

		expect(error.code).toEqual(errorCodes.RELATION_ONE_TO_ONE_CREATE)
		expect(error.type).toEqual('RELATION_ONE_TO_ONE_CREATE')
		expect(error.message).toEqual(
			`You set LegatoErrorRelationOneToOneCreateClass.relationId : ${obj.relationId}. This target does not exist.`
		)
	})
})
