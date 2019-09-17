import { MongORMEntity } from '../../src/entity'
import { MongORMField } from '../../src/decorators/field.decorator'
import { MongORMRelation } from '../../src/decorators/relation.decorator'
import { UserORM } from './User.orm'
import { Travel } from '../data'
import { ObjectID } from 'mongodb'

export class TravelORM extends MongORMEntity {
	@MongORMField()
	from: string

	@MongORMField()
	to: string

	@MongORMField()
	duration: number

	@MongORMField()
	price: number

	@MongORMField()
	startDate: Date

	@MongORMRelation({
		populatedKey: 'passengers',
		targetType: UserORM,
	})
	passengersIds: ObjectID[] = []
	passengers?: UserORM[]

	constructor() {
		super()
		const travel = new Travel()
		this.from = travel.from
		this.to = travel.to
		this.duration = travel.duration
		this.price = travel.price
		this.startDate = travel.startDate
	}
}
