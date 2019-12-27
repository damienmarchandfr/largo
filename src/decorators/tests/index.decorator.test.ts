import { LegatoMetaDataStorage, getConnection, setConnection } from '../..'
import { LegatoConnection } from '../../connection'
import { IndexDecoratorUniqueTest } from './Decorator.entity.test'

const databaseName = 'indexDecorator'

describe('LegatoIndex decorator', () => {
	beforeEach(() => {
		if (getConnection()) {
			setConnection(null)
		}
	})

	it('should add index meta to LegatoMetaDataStorage', () => {
		const classIndexMetas = LegatoMetaDataStorage().LegatoIndexMetas
			.IndexDecoratorTest
		expect(classIndexMetas.length).toEqual(2)

		// Unique index
		expect(classIndexMetas[0]).toStrictEqual({
			key: 'unique',
			unique: true,
		})

		// Not unique index
		expect(classIndexMetas[1]).toStrictEqual({
			key: 'notUnique',
			unique: false,
		})
	})

	it('should create a unique index', async () => {
		const connexion = await new LegatoConnection({
			databaseName,
		}).connect({
			clean: true,
		})

		await connexion.collections.IndexDecoratorUniqueTest.insertOne(
			new IndexDecoratorUniqueTest()
		)

		let hasError = false

		try {
			await connexion.collections.IndexDecoratorUniqueTest.insertOne(
				new IndexDecoratorUniqueTest()
			)
		} catch (error) {
			hasError = true
		}

		expect(hasError).toBe(true)

		// Check if just one inserted
		const count = await connexion.collections.IndexDecoratorUniqueTest.countDocuments()
		expect(count).toEqual(1)
	})
})
