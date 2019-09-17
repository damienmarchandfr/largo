import { MongORMEntity } from '../../src/entity'
import { MongORMField } from '../../src/decorators/field.decorator'
import { MongORMRelation } from '../../src/decorators/relation.decorator'
import { UserORM } from './User.orm'
import { ObjectID } from 'mongodb'
import { Airport } from '../data'

export class AirportORM extends MongORMEntity {
	@MongORMField()
	city: string

	@MongORMRelation({
		populatedKey: 'employees',
		targetType: UserORM,
	})
	employeesIds: ObjectID[] = []
	employees?: UserORM[]

	@MongORMRelation({
		populatedKey: 'clients',
		targetType: UserORM,
	})
	clientsIds: ObjectID[] = []
	clients?: UserORM[]

	@MongORMRelation({
		populatedKey: 'boss',
		targetType: UserORM,
	})
	bossId: ObjectID | null = null
	boss?: UserORM

	constructor() {
		super()
		const airport = new Airport()
		this.city = airport.city
	}
}
