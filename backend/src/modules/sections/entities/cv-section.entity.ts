import {
  Column,
  Entity,
  Index,
  ManyToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Entity as DomainEntity } from '../../../common/domain/entity';
import { CvEntity } from '../../cvs/entities/cv.entity';
import { SectionType } from './section-type.enum';

@Entity('cv_sections')
@Index('ix_cv_sections_cv_id', ['cvId'])
@Index('uq_cv_sections_cv_id_order_index', ['cvId', 'orderIndex'], {
  unique: true,
})
export class CvSectionEntity extends DomainEntity {
  @Column({ name: 'cv_id', type: 'uuid' })
  cvId!: string;

  @Column({
    name: 'type',
    type: 'enum',
    enum: SectionType,
    enumName: 'cv_section_type',
  })
  type!: SectionType;

  @Column({ name: 'order_index', type: 'int' })
  orderIndex!: number;

  @Column({ name: 'content', type: 'jsonb', default: () => "'{}'::jsonb" })
  content!: Record<string, any>;

  @UpdateDateColumn({ name: 'updated_on_utc', type: 'timestamptz' })
  updatedOnUtc!: Date;

  @ManyToOne(() => CvEntity, (cv) => cv.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cv_id' })
  cv!: CvEntity;
}
