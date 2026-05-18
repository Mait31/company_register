from app.models.enums import OrderStatus


class InvalidArchiveRequest(ValueError):
    pass


def assert_can_archive(order_status: str, has_registration_result_file: bool) -> None:
    if order_status != OrderStatus.REGISTERED.value:
        raise InvalidArchiveRequest("只有注册成功的工单才能归档")
    if not has_registration_result_file:
        raise InvalidArchiveRequest("归档前必须上传注册结果文件")
