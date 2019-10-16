import { LegatoErrorRelationOneToOneDelete } from './RelationOneToOneDelete.error'
import { LegatoEntity } from '../entity'
import { ObjectID } from 'bson'
import { LegatoRelation } from '../decorators/relation.decorator'
import { errorCodes } from '.'
import { exec } from 'child_process'

describe('RelationOneToOneDelete error', () => {
	it('should be valid', () => {
		class RelationOneToOneDeleteParentClass extends LegatoEntity {
			relationId: ObjectID

			constructor() {
				super()
				this._id = new ObjectID()
				this.relationId = new ObjectID()
			}
		}

		class RelationOneToOneDeleteChildClass extends LegatoEntity {
			constructor() {
				super()
				this._id = new ObjectID()
			}
		}

		const parent = new RelationOneToOneDeleteParentClass()
		const toDelete = new RelationOneToOneDeleteChildClass()

		const error = new LegatoErrorRelationOneToOneDelete(
			toDelete,
			parent,
			'relationId'
		)

		expect(error.code).toEqual(errorCodes.RELATION_ONE_TO_ONE_DELETE)
		expect(error.type).toEqual('RELATION_ONE_TO_ONE_DELETE')
		expect(error.message).toEqual(
			`Cannot delete RelationOneToOneDeleteChildClass with _id : ${toDelete._id}. RelationOneToOneDeleteParentClass with _id : ${parent._id} is linked with RelationOneToOneDeleteParentClass.relationId.`
		)
	})
})
