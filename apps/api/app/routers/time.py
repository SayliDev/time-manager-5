"""Time tracking routes."""

@router.post("/trackTime", response_model=TimeTrackingResponse, status_code=status.HTTP_201_CREATED)
def track_time_endpoint(payload: TimeTrackingCreate):
    try:
        time_entry = track_time(
            user_id=payload.user_id,
            start_time=payload.start_time,
            end_time=payload.end_time,
            description=payload.description,
        )
        return time_entry
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(error),
        )
    except RuntimeError as error:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(error),
        )
    