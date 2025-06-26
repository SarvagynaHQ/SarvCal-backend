import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export class CreateMeetingDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsEmail()
  @IsNotEmpty()
  guestEmail: string;

  @IsString()
  @IsOptional()
  additionalInfo: string;
}

export class MeetingIdDTO {
  @IsUUID(4, { message: "Invaild uuid" })
  @IsNotEmpty()
  meetingId: string;
}

export class EventIdDTO {
  @IsUUID(4, { message: "Invalid event ID" })
  @IsNotEmpty()
  eventId: string;
}

export class AvailableSlotsDTO {
  @IsUUID(4, { message: "Invalid event ID" })
  @IsNotEmpty()
  eventId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string; // Format: YYYY-MM-DD
}

export class RescheduleMeetingDto {
  @IsString()
  @IsNotEmpty()
  meetingId: string;

  @IsDateString()
  newStartTime: string;

  @IsDateString()
  newEndTime: string;
}
