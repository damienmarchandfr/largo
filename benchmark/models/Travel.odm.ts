import { MongODMEntity } from '../../src/entity'
import { MongODMField } from '../../src/decorators/field.decorator'
import { MongODMRelation } from '../../src/decorators/relation.decorator'
import { UserODM } from './User.odm'
import { Travel } from '../data'
import { ObjectID } from 'mongodb'

export class TravelODM extends MongODMEntity {
	@MongODMField()
	from: string

	@MongODMField()
	to: string

	@MongODMField()
	duration: number

	@MongODMField()
	price: number

	@MongODMField()
	startDate: Date

	@MongODMRelation({
		populatedKey: 'passengers',
		targetType: UserODM,
	})
	passengersIds: ObjectID[] = []
	passengers?: UserODM[]

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
