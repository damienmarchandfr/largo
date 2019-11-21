import { LegatoConnection } from '../../../connection'
import { LegatoEntity } from '../..'
import { LegatoField } from '../../../decorators/field.decorator'
import {
	FindOneEntityTestWithoutDecorator,
	FindOneEntityTest,
} from './entities/FindOne.entity.test'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'
import { getConnection, setConnection } from '../../..'

const databaseName = 'findoneTest'

describe('static method findOne', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should throw an error if collection does not exist', async () => {
		await new LegatoConnection({
			databaseName,
		}).connect({
			clean: false,
		})

		let hasError = false

		try {
			await FindOneEntityTestWithoutDecorator.findOne<
				FindOneEntityTestWithoutDecorator
			>({ name: 'john' })
		} catch (error) {
			hasError = true
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toEqual(true)
	})

	it('should findOne', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const obj = new FindOneEntityTest('john')

		// Insert user with mongodb native lib
		await connection.collections.FindOneEntityTest.insertOne(obj)

		const result = await FindOneEntityTest.findOne<FindOneEntityTest>({
			name: 'john',
		})

		expect(result).not.toBe(null)
		expect(result).toMatchObject({
			_id: obj._id,
			name: 'john',
		})

		expect((result as FindOneEntityTest).getCopy()).toEqual({
			_id: obj._id,
			name: 'john',
		})
	})

	it('should not find and return null', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		// Insert user with mongodb native lib
		await connection.collections.FindOneEntityTest.insertOne(
			new FindOneEntityTest('john')
		)

		const result = await FindOneEntityTest.findOne({
			name: 'john doe',
		})

		expect(result).toEqual(null)
	})
})
