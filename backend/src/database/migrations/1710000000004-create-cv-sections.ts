import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateCvSections1710000000004 implements MigrationInterface {
  name = 'CreateCvSections1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for SectionType
    await queryRunner.query(`
      CREATE TYPE cv_section_type AS ENUM (
        'PERSONAL_INFO',
        'EXPERIENCE',
        'EDUCATION',
        'SKILLS',
        'PROJECTS',
        'LANGUAGES',
        'CERTIFICATIONS',
        'CUSTOM'
      )
    `);

    await queryRunner.createTable(
      new Table({
        name: 'cv_sections',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'cv_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'cv_section_type',
            isNullable: false,
          },
          {
            name: 'order_index',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'content',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'::jsonb",
          },
          {
            name: 'created_on_utc',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_on_utc',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'cv_sections',
      new TableForeignKey({
        name: 'fk_cv_sections_cvs_cv_id',
        columnNames: ['cv_id'],
        referencedTableName: 'cvs',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'cv_sections',
      new TableIndex({
        name: 'ix_cv_sections_cv_id',
        columnNames: ['cv_id'],
      }),
    );

    await queryRunner.createIndex(
      'cv_sections',
      new TableIndex({
        name: 'uq_cv_sections_cv_id_order_index',
        columnNames: ['cv_id', 'order_index'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(
      'cv_sections',
      'uq_cv_sections_cv_id_order_index',
    );
    await queryRunner.dropIndex('cv_sections', 'ix_cv_sections_cv_id');
    await queryRunner.dropForeignKey('cv_sections', 'fk_cv_sections_cvs_cv_id');
    await queryRunner.dropTable('cv_sections');
    await queryRunner.query('DROP TYPE cv_section_type');
  }
}
