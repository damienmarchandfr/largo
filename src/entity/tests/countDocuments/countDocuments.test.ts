import { LegatoConnection } from '../../../connection'
import { getConnection, setConnection } from '../../..'
import {
	CountDocumentsTestWithoutDecorator,
	CountDocumentsTest,
} from './entities/CountDocuments.entity'
import { LegatoErrorCollectionDoesNotExist } from '../../../errors'

const databaseName = 'countDocumentsTest'

describe('static method countDocuments', () => {
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
			await CountDocumentsTestWithoutDecorator.countDocuments()
		} catch (error) {
			hasError = true
			expect(error.message).toEqual(
				`Cannot find CountDocumentsTestWithoutDecorator collection.`
			)
			expect(error).toBeInstanceOf(LegatoErrorCollectionDoesNotExist)
		}

		expect(hasError).toBeTruthy()
	})

	it('should count all documents', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert: CountDocumentsTest[] = []

		for (let i = 0; i < 10; i++) {
			toInsert.push(
				CountDocumentsTest.create<CountDocumentsTest>({ name: 'Legato' })
			)
		}
		await connection.collections.CountDocumentsTest.insertMany(toInsert)

		const count = await CountDocumentsTest.countDocuments()
		expect(count).toEqual(10)
	})

	it('should count documents with query filter', async () => {
		const connection = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		const toInsert: CountDocumentsTest[] = []

		for (let i = 0; i < 10; i++) {
			toInsert.push(
				CountDocumentsTest.create<CountDocumentsTest>({ name: 'Legato' })
			)
		}

		toInsert.push(
			CountDocumentsTest.create<CountDocumentsTest>({ name: 'John' })
		)

		await connection.collections.CountDocumentsTest.insertMany(toInsert)

		const count = await CountDocumentsTest.countDocuments({
			name: 'John',
		})
		expect(count).toEqual(1)
	})
})
